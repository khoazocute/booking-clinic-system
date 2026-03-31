package com.example.booking_clinic.dto.auth;

public record LoginResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String status
) {
}