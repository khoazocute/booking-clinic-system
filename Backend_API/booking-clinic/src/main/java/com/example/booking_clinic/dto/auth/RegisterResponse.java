package com.example.booking_clinic.dto.auth;

import java.time.LocalDateTime;

// Response trả về sau khi đăng ký thành công, có thể chứa thông tin người dùng đã được tạo
//Không trả về mật khẩu bảo mật 
public record RegisterResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String status,
        LocalDateTime createdAt
) {
}
