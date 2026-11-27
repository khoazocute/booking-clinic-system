package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConversationViews.PatientConversation;
import com.example.booking_clinic.dto.ai.AiConversationViews.PatientMessage;
import com.example.booking_clinic.entity.AiConversation;
import com.example.booking_clinic.entity.AiMessage;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.AiConversationRepository;
import com.example.booking_clinic.repository.AiMessageRepository;
import com.example.booking_clinic.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Persistence for AI conversations. Each method is its own short transaction, so no database connection
 * is held while the LLM works (a turn can take several seconds).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiConversationStore {

    /** Messages sent to the model as context (the Python service caps history the same way). */
    static final int HISTORY_MESSAGES = 12;
    /** A conversation untouched for this long is not restored; the widget starts fresh. */
    static final int RESTORE_WITHIN_DAYS = 7;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final AiConversationRepository conversations;
    private final AiMessageRepository messages;
    private final UserRepository users;
    private final AiCostEstimator costs;

    public record Opened(Long conversationId, List<AiChatMessage> history) {
    }

    public record Telemetry(String source, String model, List<String> toolCalls, Integer promptTokens,
                            Integer completionTokens, long latencyMs, boolean outputBlocked) {
    }

    /** Appends the patient's message and returns the trusted history (from the database) for the model. */
    @Transactional
    public Opened appendUserMessage(Long userId, Long conversationId, String message) {
        AiConversation conversation;
        if (conversationId != null) {
            conversation = conversations.findById(conversationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
            if (!conversation.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("This conversation belongs to another user");
            }
            conversation.setUpdatedAt(LocalDateTime.now());
        } else {
            User user = users.getReferenceById(userId);
            conversation = conversations.save(AiConversation.builder()
                    .user(user)
                    .title(truncate(message.trim(), 150))
                    .build());
        }
        messages.save(AiMessage.builder().conversation(conversation).role("user").content(message.trim()).build());

        List<AiMessage> recent = new ArrayList<>(
                messages.findByConversation_IdOrderByIdDesc(conversation.getId(), PageRequest.of(0, HISTORY_MESSAGES)));
        Collections.reverse(recent);
        List<AiChatMessage> history = recent.stream()
                .dropWhile(m -> !"user".equals(m.getRole())) // context must not start mid-answer
                .map(m -> new AiChatMessage(m.getRole(), truncate(m.getContent(), 2000)))
                .toList();
        return new Opened(conversation.getId(), history);
    }

    @Transactional
    public AiMessage saveAssistant(Long conversationId, AiChatResponse response, Telemetry t) {
        AiMessage message = AiMessage.builder()
                .conversation(conversations.getReferenceById(conversationId))
                .role("assistant")
                .content(response.answer() == null ? "" : response.answer())
                .source(response.source() != null ? response.source() : t.source())
                .model(t.model())
                .toolCalls(t.toolCalls() == null || t.toolCalls().isEmpty() ? null : truncate(String.join(",", t.toolCalls()), 500))
                .promptTokens(t.promptTokens())
                .completionTokens(t.completionTokens())
                .costUsd(costs.usd(t.model(), t.promptTokens(), t.completionTokens()))
                .latencyMs(t.latencyMs())
                .emergencyCategory(response.emergency() == null ? null : response.emergency().category())
                .handoffSuggested(response.handoffSuggested())
                .degraded(response.degraded())
                .outputBlocked(t.outputBlocked())
                .citationCount(response.citations() == null ? 0 : response.citations().size())
                .artifactsJson(JSON.writeValueAsString(response))
                .build();
        return messages.save(message);
    }

    @Transactional
    public void feedback(Long userId, Long messageId, String rating, String comment) {
        AiMessage message = messages.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        if (!message.getConversation().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This message belongs to another user");
        }
        if (!"assistant".equals(message.getRole())) {
            throw new IllegalArgumentException("Only assistant answers can be rated");
        }
        message.setFeedback(rating);
        message.setFeedbackComment(comment == null || comment.isBlank() ? null : truncate(comment.trim(), 500));
        messages.save(message);
    }

    /** The patient's most recent conversation (within a week), or null. */
    @Transactional(readOnly = true)
    public PatientConversation latest(Long userId) {
        return conversations.findFirstByUser_IdAndUpdatedAtAfterOrderByUpdatedAtDesc(
                        userId, LocalDateTime.now().minusDays(RESTORE_WITHIN_DAYS))
                .map(c -> new PatientConversation(c.getId(), messages.findByConversation_IdOrderByIdAsc(c.getId())
                        .stream().map(this::toPatientMessage).toList()))
                .orElse(null);
    }

    private PatientMessage toPatientMessage(AiMessage m) {
        AiChatResponse response = null;
        if ("assistant".equals(m.getRole()) && m.getArtifactsJson() != null) {
            try {
                response = JSON.readValue(m.getArtifactsJson(), AiChatResponse.class)
                        .withIds(m.getConversation().getId(), m.getId());
            } catch (RuntimeException e) {
                log.warn("Unreadable artifacts for AI message {}: {}", m.getId(), e.getMessage());
            }
        }
        return new PatientMessage(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt(), m.getFeedback(), response);
    }

    static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max);
    }
}
