package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.dto.payment.PaymentResponse;
import com.example.booking_clinic.dto.payment.UpdatePaymentStatusRequest;

public interface PaymentService {
    PaymentResponse createPayment(CreatePaymentRequest request);
    PaymentResponse getPaymentById(Long id);
    PaymentResponse getPaymentByAppointmentId(Long appointmentId);
    PaymentResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request);
}
