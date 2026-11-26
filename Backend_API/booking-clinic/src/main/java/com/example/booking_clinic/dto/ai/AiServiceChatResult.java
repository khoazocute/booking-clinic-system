package com.example.booking_clinic.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Wire contract of AI_Service POST /v1/chat, kept separate from the public {@link AiChatResponse}:
 * fields the Python service does not send (degraded, source, suggestions) must not be required here.
 * Jackson 3 fails on missing primitive record components, which broke deserializing directly into
 * AiChatResponse.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiServiceChatResult(
        String answer,
        AiEmergency emergency,
        List<AiChatResponse.Citation> citations,
        List<AiChatResponse.DoctorCard> doctors,
        List<AiChatResponse.Slot> slots,
        AiChatResponse.BookingProposal bookingProposal,
        Boolean handoffSuggested,
        String handoffReason,
        Boolean outputBlocked,
        List<String> toolCalls,
        String model,
        Integer promptTokens,
        Integer completionTokens
) {
    public AiChatResponse toResponse() {
        return new AiChatResponse(answer, emergency, orEmpty(citations), orEmpty(doctors), orEmpty(slots),
                bookingProposal, List.of(), false, "ai-service", Boolean.TRUE.equals(handoffSuggested), handoffReason,
                null, null);
    }

    private static <T> List<T> orEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }
}
