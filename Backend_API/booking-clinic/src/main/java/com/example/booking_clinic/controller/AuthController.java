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
import com.example.booking_clinic.dto.auth.LogoutRequest;
import com.example.booking_clinic.dto.auth.RefreshTokenRequest;
import com.example.booking_clinic.dto.auth.RefreshTokenResponse;
import com.example.booking_clinic.dto.auth.CurrentUserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import com.example.booking_clinic.dto.auth.ChangePasswordRequest;
import com.example.booking_clinic.dto.auth.ForgotPasswordRequest;
import com.example.booking_clinic.dto.auth.ResetPasswordRequest;@RestController
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

    @PostMapping("/logout")
    // Method sẽ trả về HTTP response và được bọc trong API response 
    // APi này chỉ trả trạng thái thành công or thất bại và k trả về data
    // LogoutRequest là DTO đầu vào ( chứa dữ liệu đầu vào), và kích hoạt validation
    //@Request lấy json từ client và map vào object LogoutRequest
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody LogoutRequest request) {

        authService.logout(request); //controller gọi Service
        return ResponseEntity.ok(
                ApiResponse.success("Logout successfully", null)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser() {
        CurrentUserResponse response = authService.getCurrentUser();

        return ResponseEntity.ok(
            ApiResponse.success("Current user fetched successfully", response)
        );
    }
    
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        authService.changePassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Password changed successfully", null)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("OTP sent to your email", null)
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        authService.resetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Password reset successfully", null)
        );
    }
}
//File này chỉ làm 3 việc chính:
//1. Nhận request đăng ký từ client (POST /api/v1/auth/register)
//2. Gọi service để xử lý logic đăng ký (authService.register(request))
//3. Trả về response cho client với thông tin người dùng đã được tạo (RegisterResponse) và mã trạng thái HTTP 201 Created.
