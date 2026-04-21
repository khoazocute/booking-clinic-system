package com.example.booking_clinic.dto.appointment;

import jakarta.validation.constraints.NotBlank;

public record UpdateAppointmentStatusRequest(

        @NotBlank(message = "Status is required")
        String status,       // CONFIRMED | CANCELLED | COMPLETED

        String cancelReason  // bắt buộc điền khi status = CANCELLED
) {}
