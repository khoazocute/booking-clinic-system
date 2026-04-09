package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String to, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@bookingclinic.com");
        message.setTo(to);
        message.setSubject("Your Password Reset OTP");
        message.setText("Your OTP code to reset password is: " + otpCode + "\n\nIt will expire in 15 minutes.");
        mailSender.send(message);
    }
}
