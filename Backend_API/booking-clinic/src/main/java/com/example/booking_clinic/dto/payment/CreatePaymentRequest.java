package com.example.booking_clinic.dto.payment;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
        @NotNull(message = "Appointment ID is required")
        Long appointmentId,

        @NotNull(message = "Payment method is required")
        String paymentMethod
) {
}
