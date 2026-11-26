package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.payment.VnpayResultResponse;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * VNPay (API 2.1.0). The hash secret lives only here: the browser receives a signed URL and, on return,
 * hands the parameters back for verification. A booking is marked paid only when VNPay's HMAC-SHA512
 * signature is valid, the response code is success, and the amount equals the doctor's fee in our database.
 * Both the browser return ({@link #verifyReturn}) and VNPay's server-to-server IPN ({@link #handleIpn})
 * go through the same check, and recording is idempotent.
 */
@Slf4j
@Service
public class VnpayService {

    static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNP_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    /** txnRef = A{appointmentId}T{epochSeconds}: unique per attempt, and covered by VNPay's signature. */
    private static final Pattern TXN_REF = Pattern.compile("A(\\d+)T\\d+");

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public VnpayService(AppointmentRepository appointmentRepository, PaymentRepository paymentRepository,
                        PaymentService paymentService,
                        @Value("${app.vnpay.tmn-code:}") String tmnCode,
                        @Value("${app.vnpay.hash-secret:}") String hashSecret,
                        @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
                        @Value("${app.vnpay.return-url:http://localhost:5173/payment/return}") String returnUrl) {
        this(appointmentRepository, paymentRepository, paymentService, tmnCode, hashSecret, payUrl, returnUrl,
                Clock.system(VN));
    }

    VnpayService(AppointmentRepository appointmentRepository, PaymentRepository paymentRepository,
                 PaymentService paymentService, String tmnCode, String hashSecret, String payUrl, String returnUrl,
                 Clock clock) {
        this.appointmentRepository = appointmentRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.clock = clock;
    }

    public boolean isConfigured() {
        return !tmnCode.isBlank() && !hashSecret.isBlank();
    }

    // ---------- 1. create the payment URL ----------

    /** The amount comes from the database (doctor's fee), never from the client. */
    @Transactional(readOnly = true)
    public String createPaymentUrl(Long appointmentId, String clientIp) {
        requireConfigured();
        Appointment appointment = ownAppointment(appointmentId);
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalStateException("Lịch hẹn không còn ở trạng thái chờ thanh toán");
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (appointment.getPaymentDeadline() != null && appointment.getPaymentDeadline().isBefore(now)) {
            throw new IllegalStateException("Đã hết thời gian thanh toán cho lịch hẹn này");
        }
        if (paymentRepository.existsByAppointment_IdAndPaymentType(appointmentId, "BOOKING")) {
            throw new IllegalStateException("Lịch hẹn này đã có khoản thanh toán");
        }
        long amount = toVnpAmount(fee(appointment));

        SortedMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", "A" + appointmentId + "T" + now.atZone(VN).toEpochSecond());
        params.put("vnp_OrderInfo", "Thanh toan lich kham " + appointmentId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
        params.put("vnp_CreateDate", now.format(VNP_DATE));
        // VNPay rejects the payment after this; our own 10-minute booking deadline still applies
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(VNP_DATE));

        String query = canonicalQuery(params);
        return payUrl + "?" + query + "&vnp_SecureHash=" + sign(query);
    }

    // ---------- 2. browser return ----------

    /** Called by the patient's browser with the query string VNPay redirected to. */
    @Transactional(readOnly = true)
    public VnpayResultResponse verifyReturn(Map<String, String> params) {
        Outcome outcome = process(params, true);
        return outcome.response();
    }

    // ---------- 3. IPN (server to server) ----------

    /** VNPay's IPN contract: answer with RspCode/Message, VNPay retries until it gets "00" or "02". */
    @Transactional(readOnly = true)
    public Map<String, String> handleIpn(Map<String, String> params) {
        Outcome outcome = process(params, false);
        Map<String, String> body = new LinkedHashMap<>();
        body.put("RspCode", outcome.ipnCode());
        body.put("Message", outcome.ipnMessage());
        return body;
    }

    // ---------- core ----------

    private synchronized Outcome process(Map<String, String> params, boolean requireOwner) {
        if (!isConfigured()) {
            return Outcome.of("99", "Not configured", VnpayResultResponse.failure("NOT_CONFIGURED", "VNPay chưa được cấu hình", params));
        }
        if (!hasValidSignature(params)) {
            log.warn("VNPay callback with an invalid signature: txnRef={}", params.get("vnp_TxnRef"));
            return Outcome.of("97", "Invalid signature",
                    VnpayResultResponse.failure("INVALID_SIGNATURE", "Chữ ký giao dịch không hợp lệ", params));
        }

        Matcher ref = TXN_REF.matcher(params.getOrDefault("vnp_TxnRef", ""));
        if (!ref.matches()) {
            return Outcome.of("01", "Order not found", VnpayResultResponse.failure("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng", params));
        }
        Long appointmentId = Long.valueOf(ref.group(1));
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return Outcome.of("01", "Order not found", VnpayResultResponse.failure("ORDER_NOT_FOUND", "Không tìm thấy lịch hẹn", params));
        }
        if (requireOwner) {
            assertOwner(appointment);
        }

        BigDecimal expected = fee(appointment);
        if (!String.valueOf(toVnpAmount(expected)).equals(params.get("vnp_Amount"))) {
            log.warn("VNPay amount mismatch for appointment {}: got {}, expected {}", appointmentId,
                    params.get("vnp_Amount"), toVnpAmount(expected));
            return Outcome.of("04", "Invalid amount", VnpayResultResponse.failure("INVALID_AMOUNT", "Số tiền không khớp", params));
        }

        boolean paid = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.getOrDefault("vnp_TransactionStatus", "00"));
        if (!paid) {
            return Outcome.of("00", "Confirm Success",
                    VnpayResultResponse.failure("FAILED", "Giao dịch không thành công", params).withAppointment(appointmentId));
        }

        try {
            paymentService.recordVerifiedVnpayPayment(appointmentId, expected, params.get("vnp_TransactionNo"));
            return Outcome.of("00", "Confirm Success", VnpayResultResponse.success(appointmentId, expected, params));
        } catch (RuntimeException e) {
            // already recorded under another transaction, or the appointment expired while paying
            log.warn("VNPay payment for appointment {} not recorded: {}", appointmentId, e.getMessage());
            return Outcome.of("02", "Order already confirmed",
                    VnpayResultResponse.failure("NOT_RECORDED", e.getMessage(), params).withAppointment(appointmentId));
        }
    }

    boolean hasValidSignature(Map<String, String> params) {
        String received = params.get("vnp_SecureHash");
        if (received == null || received.isBlank()) {
            return false;
        }
        SortedMap<String, String> fields = params.entrySet().stream()
                .filter(e -> e.getKey().startsWith("vnp_"))
                .filter(e -> !e.getKey().equals("vnp_SecureHash") && !e.getKey().equals("vnp_SecureHashType"))
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, TreeMap::new));
        byte[] expected = sign(canonicalQuery(fields)).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = received.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual); // constant time
    }

    /** VNPay's canonical form: keys sorted, values URL-encoded (space as '+'), joined with '&'. */
    static String canonicalQuery(SortedMap<String, String> params) {
        return params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.US_ASCII) + "="
                        + URLEncoder.encode(e.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
    }

    String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(hashSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign VNPay request", e);
        }
    }

    private static BigDecimal fee(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor() == null ? null : appointment.getDoctor().getConsultationFee();
        if (fee == null || fee.signum() <= 0) {
            throw new IllegalStateException("Lịch khám này không có phí cần thanh toán qua VNPay");
        }
        return fee;
    }

    private static long toVnpAmount(BigDecimal vnd) {
        return vnd.setScale(0, java.math.RoundingMode.HALF_UP).longValueExact() * 100; // VNPay uses VND x 100
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException("VNPay chưa được cấu hình (VNPAY_TMN_CODE, VNPAY_HASH_SECRET)");
        }
    }

    private Appointment ownAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
        assertOwner(appointment);
        return appointment;
    }

    private static void assertOwner(Appointment appointment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)
                || appointment.getPatient() == null || appointment.getPatient().getUser() == null
                || !appointment.getPatient().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thanh toán lịch hẹn này");
        }
    }

    private record Outcome(String ipnCode, String ipnMessage, VnpayResultResponse response) {
        static Outcome of(String code, String message, VnpayResultResponse response) {
            return new Outcome(code, message, response);
        }
    }
}
