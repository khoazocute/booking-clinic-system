package com.example.booking_clinic.dto.prescription;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PrescriptionItemDto(
        @NotNull(message = "Medicine ID is required")
        Long medicineId,

        @NotNull(message = "Dose per time is required")
        @Min(value = 1, message = "Dose per time must be at least 1")
        Integer dosePerTime,

        @NotNull(message = "Times per day is required")
        @Min(value = 1, message = "Times per day must be at least 1")
        Integer timesPerDay,

        @NotNull(message = "Duration days is required")
        @Min(value = 1, message = "Duration days must be at least 1")
        Integer durationDays,

        String dosageText,

        String instruction,

        String note
) {
}
