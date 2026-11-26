package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiServiceChatResult;
import com.example.booking_clinic.dto.ai.AiTriageResult;
import com.example.booking_clinic.dto.support.SupportAssistResult;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Port to the Python AI_Service. Every method throws
 * {@link com.example.booking_clinic.common.exception.AiServiceUnavailableException} on failure,
 * so callers can degrade to the local keyword router.
 */
public interface AiServiceGateway {

    boolean isEnabled();

    AiTriageResult triage(String message);

    /** One chat turn; the result carries telemetry (model, tools, tokens) besides the answer. */
    AiServiceChatResult chat(List<AiChatMessage> messages);

    /**
     * The same turn as a stream: {@code progress} receives {"type": "status", "tool"} and
     * {"type": "delta", "text"} events while the model works; the final result is returned.
     */
    AiServiceChatResult chatStream(List<AiChatMessage> messages, Consumer<Map<String, Object>> progress);

    /** Summary + draft reply for staff answering a support ticket. */
    SupportAssistResult assist(Map<String, Object> request);

    void rebuildIndex();
}
