package com.example.booking_clinic.service;

public interface EmailService {
    void sendOtpEmail(String to, String otpCode);
}
