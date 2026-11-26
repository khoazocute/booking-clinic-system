package com.example.booking_clinic.service;

public interface EmailService {
    void sendOtpEmail(String to, String otpCode);

    /** @return false when SMTP is not configured or sending failed (callers fall back to in-app notifications) */
    boolean sendEmail(String to, String subject, String body);
}
