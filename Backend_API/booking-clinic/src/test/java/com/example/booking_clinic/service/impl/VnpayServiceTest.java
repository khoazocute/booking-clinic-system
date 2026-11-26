package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.payment.VnpayResultResponse;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.service.PaymentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.SortedMap;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The server is the only party that can declare a VNPay payment successful. */
class VnpayServiceTest {

    private static final String SECRET = "TEST_SECRET_NOT_REAL";
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-26T03:00:00Z"), VnpayService.VN);

    private AppointmentRepository appointments;
    private PaymentRepository payments;
    private PaymentService paymentService;
    private VnpayService vnpay;
    private final User owner = User.builder().id(7L).email("p@example.test").build();
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        appointments = mock(AppointmentRepository.class);
        payments = mock(PaymentRepository.class);
        paymentService = mock(PaymentService.class);
        vnpay = new VnpayService(appointments, payments, paymentService, "TMNTEST", SECRET,
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "http://localhost:5173/payment/return", CLOCK);

        appointment = Appointment.builder()
                .id(42L)
                .status(AppointmentStatus.PENDING)
                .paymentDeadline(LocalDateTime.now(CLOCK).plusMinutes(5))
                .patient(Patient.builder().id(3L).user(owner).build())
                .doctor(Doctor.builder().id(2L).consultationFee(new BigDecimal("300000.00")).build())
                .build();
        when(appointments.findById(42L)).thenReturn(Optional.of(appointment));
        loginAs(owner);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private static void loginAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    /** What VNPay would send back: our params plus its own fields, signed with the shared secret. */
    private Map<String, String> vnpayReturn(String amount, String responseCode) {
        SortedMap<String, String> p = new TreeMap<>();
        p.put("vnp_Amount", amount);
        p.put("vnp_BankCode", "NCB");
        p.put("vnp_OrderInfo", "Thanh toan lich kham 42");
        p.put("vnp_PayDate", "20261126100500");
        p.put("vnp_ResponseCode", responseCode);
        p.put("vnp_TmnCode", "TMNTEST");
        p.put("vnp_TransactionNo", "14600001");
        p.put("vnp_TransactionStatus", responseCode);
        p.put("vnp_TxnRef", "A42T1795752000");
        Map<String, String> signed = new HashMap<>(p);
        signed.put("vnp_SecureHash", vnpay.sign(VnpayService.canonicalQuery(p)));
        return signed;
    }

    @Test
    void paymentUrlIsSignedServerSideWithTheAmountFromTheDatabase() {
        String url = vnpay.createPaymentUrl(42L, "1.2.3.4");

        Map<String, String> query = new HashMap<>();
        for (String pair : URI.create(url).getRawQuery().split("&")) {
            String[] kv = pair.split("=", 2);
            query.put(kv[0], URLDecoder.decode(kv[1], StandardCharsets.US_ASCII));
        }
        assertEquals("30000000", query.get("vnp_Amount")); // 300,000 VND x 100
        assertTrue(query.get("vnp_TxnRef").startsWith("A42T"));
        assertTrue(vnpay.hasValidSignature(query), "the URL must verify with the same canonicalisation");
        assertFalse(url.contains(SECRET));
    }

    @Test
    void cannotCreateUrlForSomeoneElsesAppointment() {
        loginAs(User.builder().id(99L).build());
        assertThrows(AccessDeniedException.class, () -> vnpay.createPaymentUrl(42L, "1.2.3.4"));
    }

    @Test
    void cannotCreateUrlAfterTheDeadlineOrTwice() {
        appointment.setPaymentDeadline(LocalDateTime.now(CLOCK).minusMinutes(1));
        assertThrows(IllegalStateException.class, () -> vnpay.createPaymentUrl(42L, "1.2.3.4"));

        appointment.setPaymentDeadline(LocalDateTime.now(CLOCK).plusMinutes(5));
        when(payments.existsByAppointment_IdAndPaymentType(42L, "BOOKING")).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> vnpay.createPaymentUrl(42L, "1.2.3.4"));
    }

    @Test
    void validSuccessfulReturnRecordsThePaymentWithTheServerAmount() {
        VnpayResultResponse result = vnpay.verifyReturn(vnpayReturn("30000000", "00"));

        assertTrue(result.success());
        assertEquals("PAID", result.status());
        verify(paymentService).recordVerifiedVnpayPayment(42L, new BigDecimal("300000.00"), "14600001");
    }

    @Test
    void forgedSuccessIsRejected() {
        // the attack the old client-side flow allowed: edit the URL to say "00" without paying
        Map<String, String> forged = vnpayReturn("30000000", "24");
        forged.put("vnp_ResponseCode", "00");
        forged.put("vnp_TransactionStatus", "00");

        VnpayResultResponse result = vnpay.verifyReturn(forged);

        assertFalse(result.success());
        assertEquals("INVALID_SIGNATURE", result.status());
        verify(paymentService, never()).recordVerifiedVnpayPayment(anyLong(), any(), anyString());
    }

    @Test
    void signedButWrongAmountIsRejected() {
        VnpayResultResponse result = vnpay.verifyReturn(vnpayReturn("100", "00")); // 1 VND for a 300,000 VND visit
        assertEquals("INVALID_AMOUNT", result.status());
        verify(paymentService, never()).recordVerifiedVnpayPayment(anyLong(), any(), anyString());
    }

    @Test
    void cancelledAtVnpayIsReportedAsFailedWithoutRecording() {
        VnpayResultResponse result = vnpay.verifyReturn(vnpayReturn("30000000", "24"));
        assertEquals("FAILED", result.status());
        verify(paymentService, never()).recordVerifiedVnpayPayment(anyLong(), any(), anyString());
    }

    @Test
    void anotherPatientCannotReplayTheReturnUrl() {
        loginAs(User.builder().id(99L).build());
        assertThrows(AccessDeniedException.class, () -> vnpay.verifyReturn(vnpayReturn("30000000", "00")));
    }

    @Test
    void ipnFollowsVnpayResponseCodesAndNeedsNoLogin() {
        SecurityContextHolder.clearContext(); // VNPay's server has no patient session

        assertEquals("00", vnpay.handleIpn(vnpayReturn("30000000", "00")).get("RspCode"));
        Map<String, String> tampered = vnpayReturn("30000000", "00");
        tampered.put("vnp_Amount", "100");
        assertEquals("97", vnpay.handleIpn(tampered).get("RspCode"));
        verify(paymentService, times(1)).recordVerifiedVnpayPayment(anyLong(), any(), anyString());
    }
}
