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

    @GetMapping("/api/v1/test/admin")
    public ResponseEntity<ApiResponse<String>> adminEndpoint() {
        return ResponseEntity.ok(
                ApiResponse.success("Access granted", "ADMIN endpoint")
        );
    }

    @GetMapping("/api/v1/test/doctor")
    public ResponseEntity<ApiResponse<String>> doctorEndpoint() {
        return ResponseEntity.ok(
                ApiResponse.success("Access granted", "DOCTOR endpoint")
        );
    }

    @GetMapping("/api/v1/test/patient")
    public ResponseEntity<ApiResponse<String>> patientEndpoint() {
        return ResponseEntity.ok(
                ApiResponse.success("Access granted", "PATIENT endpoint")
        );
    }
}
