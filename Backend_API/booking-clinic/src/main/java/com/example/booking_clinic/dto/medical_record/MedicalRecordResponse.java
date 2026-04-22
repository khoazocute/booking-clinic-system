package com.example.booking_clinic.dto.medical_record;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MedicalRecordResponse(
        Long id,
        Long appointmentId,
        Long doctorId,
        String doctorName,
        Long patientId,
        String patientName,
        String symptoms,
        String diagnosis,
        String treatmentPlan,
        String notes,
        LocalDate followUpDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
