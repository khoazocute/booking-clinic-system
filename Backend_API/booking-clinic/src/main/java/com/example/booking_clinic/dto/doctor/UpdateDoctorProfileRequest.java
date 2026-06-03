package com.example.booking_clinic.dto.doctor;

public record UpdateDoctorProfileRequest(
        Long specialtyId,
        Integer experienceYears,
        String biography,
        String clinicRoom
) {
}
