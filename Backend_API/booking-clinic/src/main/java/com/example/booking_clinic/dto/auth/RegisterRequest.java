package com.example.booking_clinic.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        // Validate tự động khi có @Valid ở controller
        //Nếu có lỗi sẽ trả về lỗi 400 Bad Request và thông báo lỗi chi tiết
        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Email is required")
        // Kiểm tra định dạng email hợp lệ
        @Email(message = "Email is invalid")
        String email,

        @NotBlank(message = "Phone is required")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must contain at least 6 characters")
        String password
) {
}
