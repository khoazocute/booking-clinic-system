package com.example.booking_clinic.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record FacebookLoginRequest(
    @NotBlank(message = "Facebook credential is required")
    String credential
) {}
