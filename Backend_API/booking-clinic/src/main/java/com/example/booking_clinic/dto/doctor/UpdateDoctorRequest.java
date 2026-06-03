package com.example.booking_clinic.dto.doctor;

import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateDoctorRequest(
        Long specialtyId,

        @Min(value = 0, message = "Experience years must be greater than or equal to 0")
        Integer experienceYears,

        String qualification,
        String licenseNumber,
        LocalDate licenseExpiryDate,
        String licenseStatus,
        String biography,
        String clinicRoom,

        @Min(value = 0, message = "Consultation fee must be greater than or equal to 0")
        BigDecimal consultationFee
) {
}
