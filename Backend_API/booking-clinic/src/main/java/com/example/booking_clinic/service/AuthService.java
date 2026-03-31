package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.auth.RegisterRequest;
import com.example.booking_clinic.dto.auth.RegisterResponse;

public interface AuthService {

    RegisterResponse register(RegisterRequest request);
}
