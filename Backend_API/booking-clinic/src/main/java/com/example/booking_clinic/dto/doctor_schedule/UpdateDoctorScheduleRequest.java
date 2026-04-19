package com.example.booking_clinic.dto.doctor_schedule;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateDoctorScheduleRequest(
        @NotNull(message = "Doctor ID is required")
        Long doctorId,

        @NotNull(message = "Work date is required")
        LocalDate workDate,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime
) {
}
