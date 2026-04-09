package com.example.booking_clinic.dto.specialty;

import jakarta.validation.constraints.Size;

public record UpdateSpecialtyRequest(
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        String description
) {
}
