package com.example.booking_clinic.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One patient message. The conversation history is loaded from the database, so a client cannot inject
 * forged "assistant" turns into the prompt.
 *
 * @param conversationId null starts a new conversation
 */
public record AiChatRequest(
        Long conversationId,
        @NotBlank(message = "message is required")
        @Size(max = 2000, message = "message is too long (max 2000 characters)")
        String message
) {
}
