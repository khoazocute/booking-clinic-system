package com.example.booking_clinic.dto.doctor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DoctorResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        String avatarUrl,
        Long specialtyId,
        String specialtyName,
        Integer experienceYears,
        String qualification,
        String biography,
        String clinicRoom,
        BigDecimal averageRating,
        BigDecimal consultationFee,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
