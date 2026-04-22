package com.example.booking_clinic.dto.medical_record;

import java.time.LocalDate;

public record UpdateMedicalRecordRequest(
        String symptoms,
        String diagnosis,
        String treatmentPlan,
        String notes,
        LocalDate followUpDate
) {}
