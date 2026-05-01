package com.example.booking_clinic.dto.medicine;

import jakarta.validation.constraints.NotBlank;

public record UpdateMedicineStatusRequest(
        @NotBlank(message = "Status is required")
        String status
) {
}
