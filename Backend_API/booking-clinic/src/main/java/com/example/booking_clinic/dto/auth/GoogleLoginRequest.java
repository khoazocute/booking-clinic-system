package com.example.booking_clinic.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank(message = "Google credential is required")
    String credential
) {}
