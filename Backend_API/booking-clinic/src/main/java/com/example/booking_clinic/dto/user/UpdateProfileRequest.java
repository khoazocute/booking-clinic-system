package com.example.booking_clinic.dto.user;

public record UpdateProfileRequest(
        String fullName,
        String phone,
        String avatarUrl
) {
}
