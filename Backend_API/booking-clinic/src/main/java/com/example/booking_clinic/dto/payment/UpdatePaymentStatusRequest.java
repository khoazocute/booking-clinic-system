package com.example.booking_clinic.dto.payment;

import jakarta.validation.constraints.NotBlank;

public record UpdatePaymentStatusRequest(
        @NotBlank(message = "Status cannot be blank")
        String status
) {
}
