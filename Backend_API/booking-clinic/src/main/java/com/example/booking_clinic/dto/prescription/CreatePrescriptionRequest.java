package com.example.booking_clinic.dto.prescription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreatePrescriptionRequest(
        @NotNull(message = "Medical Record ID is required")
        Long medicalRecordId,

        String generalNote,

        @NotEmpty(message = "Items list cannot be empty")
        @Valid
        List<CreatePrescriptionItemRequest> items
) {
}
