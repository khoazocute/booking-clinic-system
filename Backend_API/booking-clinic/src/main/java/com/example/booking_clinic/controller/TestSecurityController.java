package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestSecurityController {

    @GetMapping("/api/v1/test/secure")
    public ResponseEntity<ApiResponse<String>> secureEndpoint() {
        return ResponseEntity.ok(
                ApiResponse.success("Access granted", "JWT is working")
        );
    }
}
