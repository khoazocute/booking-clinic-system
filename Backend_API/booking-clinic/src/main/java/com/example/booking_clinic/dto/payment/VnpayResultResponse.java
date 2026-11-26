package com.example.booking_clinic.dto.payment;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Result of verifying a VNPay return, decided by the server.
 *
 * @param status PAID, FAILED, INVALID_SIGNATURE, INVALID_AMOUNT, ORDER_NOT_FOUND, NOT_RECORDED or NOT_CONFIGURED
 */
public record VnpayResultResponse(
        boolean success,
        String status,
        String message,
        Long appointmentId,
        BigDecimal amount,
        String responseCode,
        String transactionNo,
        String txnRef,
        String bankCode,
        String payDate
) {
    public static VnpayResultResponse success(Long appointmentId, BigDecimal amount, Map<String, String> p) {
        return new VnpayResultResponse(true, "PAID", "Thanh toán thành công", appointmentId, amount,
                p.get("vnp_ResponseCode"), p.get("vnp_TransactionNo"), p.get("vnp_TxnRef"), p.get("vnp_BankCode"),
                p.get("vnp_PayDate"));
    }

    public static VnpayResultResponse failure(String status, String message, Map<String, String> p) {
        return new VnpayResultResponse(false, status, message, null, null, p.get("vnp_ResponseCode"),
                p.get("vnp_TransactionNo"), p.get("vnp_TxnRef"), p.get("vnp_BankCode"), p.get("vnp_PayDate"));
    }

    public VnpayResultResponse withAppointment(Long id) {
        return new VnpayResultResponse(success, status, message, id, amount, responseCode, transactionNo, txnRef,
                bankCode, payDate);
    }
}
