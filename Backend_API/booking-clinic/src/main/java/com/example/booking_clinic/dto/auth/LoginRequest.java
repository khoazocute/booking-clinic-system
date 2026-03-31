package com.example.booking_clinic.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
}
//Nhận một đối tượng LoginRequest chứa thông tin đăng nhập từ client,
// bao gồm email và mật khẩu, được sử dụng để xác thực người dùng khi đăng nhập vào hệ thống. 
//Các annotation @NotBlank và @Email đảm bảo rằng dữ liệu đầu vào hợp lệ trước khi được xử lý trong controller hoặc service, giúp tăng tính bảo mật và độ