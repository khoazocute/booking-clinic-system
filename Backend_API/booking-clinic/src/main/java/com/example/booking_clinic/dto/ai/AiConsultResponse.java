package com.example.booking_clinic.dto.ai;

import java.util.List;

public record AiConsultResponse(
        String answer,
        List<AiSuggestionResponse> suggestions
) {
}
