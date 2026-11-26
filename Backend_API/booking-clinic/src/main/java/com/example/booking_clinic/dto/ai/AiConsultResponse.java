package com.example.booking_clinic.dto.ai;

import java.util.List;

/**
 * @param emergency non-null when emergency signs were detected (answer then contains the 115 advice)
 * @param source    "ai-service" or "fallback-keyword" (AI service unavailable)
 */
public record AiConsultResponse(
        String answer,
        List<AiSuggestionResponse> suggestions,
        AiEmergency emergency,
        String source
) {
    public AiConsultResponse(String answer, List<AiSuggestionResponse> suggestions) {
        this(answer, suggestions, null, "fallback-keyword");
    }
}
