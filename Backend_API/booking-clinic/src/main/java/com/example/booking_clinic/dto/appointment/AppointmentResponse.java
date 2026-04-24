package com.example.booking_clinic.dto.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientName,       // từ patients → users.full_name
        Long doctorId,
        String doctorName,        // từ doctors → users.full_name
        Long scheduleId,
        LocalDate appointmentDate,
        LocalTime startTime,      // lấy từ doctor_schedule để hiển thị
        LocalTime endTime,        // lấy từ doctor_schedule để hiển thị
        String reason,
        String status,
        String cancelReason,
        LocalDateTime createdAt
) {}
