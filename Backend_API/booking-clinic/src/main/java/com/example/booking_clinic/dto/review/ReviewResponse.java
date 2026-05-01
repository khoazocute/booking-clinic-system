package com.example.booking_clinic.dto.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long appointmentId,
        Long doctorId,
        String doctorName,
        Long patientId,
        String patientName,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
