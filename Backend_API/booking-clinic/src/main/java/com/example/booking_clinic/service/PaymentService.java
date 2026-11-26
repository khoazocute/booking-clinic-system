package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.dto.payment.PaymentResponse;
import com.example.booking_clinic.dto.payment.UpdatePaymentStatusRequest;

import java.util.List;

public interface PaymentService {
    PaymentResponse createPayment(CreatePaymentRequest request);
    PaymentResponse getPaymentById(Long id);
    List<PaymentResponse> getPaymentsByAppointmentId(Long appointmentId);
    PaymentResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request);

    /**
     * Records a VNPay booking payment as PAID. Only {@code VnpayService} calls this, after verifying VNPay's
     * HMAC signature and the amount; it is never reachable with client-supplied data. Idempotent: the
     * browser return and VNPay's IPN may both deliver the same transaction.
     */
    PaymentResponse recordVerifiedVnpayPayment(Long appointmentId, java.math.BigDecimal amount, String transactionNo);
    List<PaymentResponse> getAllPayments();
}
