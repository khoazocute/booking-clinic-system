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
    List<PaymentResponse> getAllPayments();
}
