package com.example.booking_clinic.dto.doctor;

public record DoctorResponse(
        Long id,
        Long userId,
        Long specialtyId,
        Integer experienceYears,
        String qualification,
        String biography,
        String clinicRoom,
        Double averageRating,
        String status
) {
}
