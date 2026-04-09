package com.example.booking_clinic.dto.specialty;

import java.time.LocalDateTime;

public record SpecialtyResponse(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
