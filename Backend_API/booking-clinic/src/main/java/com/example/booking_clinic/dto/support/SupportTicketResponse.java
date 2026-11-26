package com.example.booking_clinic.dto.support;

import java.time.LocalDateTime;
import java.util.List;

/** {@code messages} is filled in detail views only; lists carry {@code lastMessage} instead. */
public record SupportTicketResponse(
        Long id,
        String status,
        String reason,
        Long patientUserId,
        String patientName,
        String patientEmail,
        String patientPhone,
        String assignedStaffName,
        String aiTranscript,
        String lastMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime closedAt,
        List<SupportMessageResponse> messages
) {
}
