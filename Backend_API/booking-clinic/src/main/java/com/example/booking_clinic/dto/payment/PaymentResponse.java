package com.example.booking_clinic.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long appointmentId,
        Long patientId,
        BigDecimal amount,
        String paymentMethod,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
