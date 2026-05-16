package com.example.booking_clinic.dto.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        Long scheduleId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String reason,
        String status,
        String cancelReason,
        LocalDateTime createdAt,
        LocalDateTime paymentDeadline
) {}
