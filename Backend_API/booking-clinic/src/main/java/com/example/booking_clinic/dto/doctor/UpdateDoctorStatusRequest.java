package com.example.booking_clinic.dto.doctor;

import jakarta.validation.constraints.NotBlank;

public record UpdateDoctorStatusRequest(
        @NotBlank(message = "Status is required")
        String status
) {
}
