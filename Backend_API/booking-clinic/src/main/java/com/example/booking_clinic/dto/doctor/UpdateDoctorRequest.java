package com.example.booking_clinic.dto.doctor;

import jakarta.validation.constraints.Min;

public record UpdateDoctorRequest(
        Long specialtyId,

        @Min(value = 0, message = "Experience years must be greater than or equal to 0")
        Integer experienceYears,

        String qualification,
        String biography,
        String clinicRoom
) {
}
