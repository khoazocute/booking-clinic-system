package com.example.booking_clinic.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Emergency detected by the AI service's red-flag rules; the UI must show it prominently. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiEmergency(String category, String message) {
}
