package com.example.booking_clinic.dto.medical_record;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateMedicalRecordRequest(
        @NotNull(message = "appointmentId is required")
        Long appointmentId,

        @NotBlank(message = "symptoms is required")
        String symptoms,

        @NotBlank(message = "diagnosis is required")
        String diagnosis,

        @NotBlank(message = "treatmentPlan is required")
        String treatmentPlan,

        String notes,

        LocalDate followUpDate
) {}
