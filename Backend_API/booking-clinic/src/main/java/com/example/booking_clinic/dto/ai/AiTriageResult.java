package com.example.booking_clinic.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Response of AI_Service POST /v1/triage. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiTriageResult(
        AiEmergency emergency,
        boolean refused,
        String answer,
        List<Suggestion> suggestions,
        String router
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Suggestion(Long specialtyId, String name, double score) {
    }
}
