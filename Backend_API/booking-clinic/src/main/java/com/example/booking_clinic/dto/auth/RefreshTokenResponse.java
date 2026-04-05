package com.example.booking_clinic.dto.auth;

public record RefreshTokenResponse(
        String accessToken
) {
}
// Tại đây backend sẽ trả accessToken mới để frontend dùng tiếp
