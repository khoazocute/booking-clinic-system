package com.example.booking_clinic.dto.support;

import java.time.LocalDateTime;

/** @param senderRole PATIENT or STAFF */
public record SupportMessageResponse(
        Long id,
        Long ticketId,
        String senderRole,
        String senderName,
        String content,
        LocalDateTime createdAt,
        boolean aiAssisted
) {
}
