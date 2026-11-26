package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private static final String FROM = "noreply@bookingclinic.com";

    private final JavaMailSender mailSender;
    private final boolean configured;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${spring.mail.username:}") String username) {
        this.mailSender = mailSender;
        this.configured = !username.isBlank();
    }

    @Override
    public void sendOtpEmail(String to, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(FROM);
        message.setTo(to);
        message.setSubject("Your Password Reset OTP");
        message.setText("Your OTP code to reset password is: " + otpCode + "\n\nIt will expire in 15 minutes.");
        mailSender.send(message);
    }

    @Override
    public boolean sendEmail(String to, String subject, String body) {
        if (!configured || to == null || to.isBlank()) {
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(FROM);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (MailException e) {
            log.warn("Email to {} failed: {}", to, e.getMessage());
            return false;
        }
    }
}
