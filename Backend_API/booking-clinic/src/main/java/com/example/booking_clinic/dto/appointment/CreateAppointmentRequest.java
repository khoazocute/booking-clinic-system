package com.example.booking_clinic.dto.appointment;

import jakarta.validation.constraints.NotNull;

public record CreateAppointmentRequest(

        @NotNull(message = "Schedule ID is required")
        Long scheduleId,     // ID khung giờ làm việc của bác sĩ

        String reason        // lý do khám (không bắt buộc)
) {}
