package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiChatRequest;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConversationViews.PatientConversation;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

public interface AiChatService {

    /**
     * Everything that must happen in the request thread and may fail with a normal HTTP error:
     * authentication, rate limit, daily quota, ownership of the conversation, saving the patient message.
     */
    PreparedTurn prepare(AiChatRequest request);

    /** Calls the AI (streaming if {@code progress} is set), falls back if needed, records telemetry. */
    AiChatResponse complete(PreparedTurn turn, Consumer<Map<String, Object>> progress);

    default AiChatResponse chat(AiChatRequest request) {
        return complete(prepare(request), null);
    }

    PatientConversation latestConversation();

    void feedback(Long messageId, String rating, String comment);

    /** @param useAi false when the system-wide daily budget is spent: answer with the free fallback */
    record PreparedTurn(Long userId, Long conversationId, List<AiChatMessage> history, String message,
                        boolean useAi) {
    }
}
