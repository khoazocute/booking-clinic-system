package com.example.booking_clinic.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record AiConsultRequest(
        @NotBlank(message = "Message is required")
        String message
) {
}