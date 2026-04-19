package com.example.booking_clinic.dto.patient;

import java.time.LocalDate;

public record PatientResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        String avatarUrl,
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
