package com.example.booking_clinic.dto.auth;

public record LoginResponse(
        String accessToken, 
        String refreshToken,
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String status
) {
}
//Response trả về sau khi đăng nhập thành công, bao gồm accessToken, refreshToken và 
// thông tin người dùng như id, fullName, email, phone, role và status.       