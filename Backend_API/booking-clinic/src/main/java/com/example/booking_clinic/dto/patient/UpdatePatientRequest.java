package com.example.booking_clinic.dto.patient;

import java.time.LocalDate;

public record UpdatePatientRequest(
        LocalDate dateOfBirth,
        String gender,
        String address,
        String bloodType,
        String identityNumber,
        String insuranceNumber,
        String emergencyContactPhone,
        String medicalHistoryNote
) {
}