package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.auth.RegisterRequest;
import com.example.booking_clinic.dto.auth.RegisterResponse;
import com.example.booking_clinic.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.booking_clinic.dto.auth.LoginRequest;
import com.example.booking_clinic.dto.auth.LoginResponse;
import com.example.booking_clinic.dto.auth.RefreshTokenRequest;
import com.example.booking_clinic.dto.auth.RefreshTokenResponse;


@RestController
@RequestMapping("/api/v1/auth") //Nhận tất cả request bắt đầu bằng /api/v1/auth
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService; //Gọi service

    @PostMapping("/register") //Nhận request POST đến /api/v1/auth/register
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
        //@Valid để kích hoạt validation tự động dựa trên các annotation trong RegisterRequest
        //@RequestBody để ánh xạ dữ liệu JSON từ request body vào đối tượng RegisterRequest
            @Valid @RequestBody RegisterRequest request) {

        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(
                ApiResponse.success("Login successfully", response)
        );
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
        @Valid @RequestBody RefreshTokenRequest request) {

        RefreshTokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(
                ApiResponse.success("Token refreshed successfully", response)
        );
    }
}
//File này chỉ làm 3 việc chính:
//1. Nhận request đăng ký từ client (POST /api/v1/auth/register)
//2. Gọi service để xử lý logic đăng ký (authService.register(request))
//3. Trả về response cho client với thông tin người dùng đã được tạo (RegisterResponse) và mã trạng thái HTTP 201 Created.