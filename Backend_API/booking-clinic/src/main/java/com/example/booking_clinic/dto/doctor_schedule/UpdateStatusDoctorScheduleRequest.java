package com.example.booking_clinic.dto.doctor_schedule;

import jakarta.validation.constraints.NotBlank;

public record UpdateStatusDoctorScheduleRequest(
        @NotBlank(message = "Status is required")
        String status
) {}
