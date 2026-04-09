package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.user.UpdateProfileRequest;
import com.example.booking_clinic.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {

        userService.updateProfile(request);
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", null)
        );
    }
}
