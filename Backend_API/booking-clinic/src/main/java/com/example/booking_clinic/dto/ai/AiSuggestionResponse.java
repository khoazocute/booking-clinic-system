package com.example.booking_clinic.dto.ai;

public record AiSuggestionResponse(
        String sourceType,
        Long sourceId,
        String title,
        String content,
        double score
) {
}