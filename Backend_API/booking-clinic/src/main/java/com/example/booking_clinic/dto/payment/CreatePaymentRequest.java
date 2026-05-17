package com.example.booking_clinic.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
        @NotNull(message = "Appointment ID is required")
        Long appointmentId,

        @NotBlank(message = "Payment method is required")
        String paymentMethod,

        // BOOKING (default) hoặc PRESCRIPTION
        String paymentType
) {
    public String resolvedType() {
        return (paymentType == null || paymentType.isBlank()) ? "BOOKING" : paymentType.toUpperCase();
    }
}
