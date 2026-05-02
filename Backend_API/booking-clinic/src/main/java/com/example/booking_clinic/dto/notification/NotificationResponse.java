package com.example.booking_clinic.dto.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        String type,
        String referenceType,
        Long referenceId,
        Boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
