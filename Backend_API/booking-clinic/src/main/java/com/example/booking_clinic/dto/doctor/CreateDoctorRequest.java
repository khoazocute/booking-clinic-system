package com.example.booking_clinic.dto.doctor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateDoctorRequest(
        @NotNull(message = "User ID is required")
        Long userId,

        @NotNull(message = "Specialty ID is required")
        Long specialtyId,

        @NotNull(message = "Experience years is required")
        @Min(value = 0, message = "Experience years must be greater than or equal to 0")
        Integer experienceYears,

        @NotBlank(message = "Qualification is required")
        String qualification,

        @NotBlank(message = "License number is required")
        String licenseNumber,

        @NotNull(message = "License expiry date is required")
        LocalDate licenseExpiryDate,

        String licenseStatus,

        @NotBlank(message = "Biography is required")
        String biography,

        @NotBlank(message = "Clinic room is required")
        String clinicRoom,

        @NotNull(message = "Consultation fee is required")
        @Min(value = 0, message = "Consultation fee must be greater than or equal to 0")
        BigDecimal consultationFee
) {
}
