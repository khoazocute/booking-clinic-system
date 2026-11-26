package com.example.booking_clinic.dto.support;

import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Agent assist for staff (wire contract of AI_Service POST /v1/support/assist, boxed fields so a missing
 * value never fails deserialisation). The draft is only shown to staff, who edit it before sending.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SupportAssistResult(
        String summary,
        String suggestedReply,
        List<AiChatResponse.Citation> sources,
        Boolean outputBlocked,
        Integer piiRedacted,
        String model,
        Integer promptTokens,
        Integer completionTokens
) {
}
