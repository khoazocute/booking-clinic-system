package com.example.booking_clinic.dto.ai;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Read models for conversation history (patient) and the LLMOps dashboard (admin). */
public final class AiConversationViews {

    private AiConversationViews() {
    }

    /** Patient: restore the chat after a reload. {@code response} is set on assistant messages. */
    public record PatientConversation(Long conversationId, List<PatientMessage> messages) {
    }

    public record PatientMessage(Long id, String role, String content, LocalDateTime createdAt, String feedback,
                                 AiChatResponse response) {
    }

    public record FeedbackRequest(
            @Pattern(regexp = "UP|DOWN", message = "rating must be UP or DOWN") String rating,
            @Size(max = 500) String comment) {
    }

    // ---------- admin: LLMOps ----------

    public record DailyPoint(LocalDate date, long turns, BigDecimal costUsd, long avgLatencyMs, long downvotes,
                             long handoffs) {
    }

    /**
     * @param answeredByAiRate share of turns answered by the LLM agent (the rest: degraded keyword fallback)
     * @param satisfactionRate up / (up + down), null without feedback
     * @param aiDraftUsedRate  share of staff support replies that started from the AI draft
     */
    public record Metrics(int days, long turns, long conversations, long uniquePatients,
                          long avgLatencyMs, long p95LatencyMs, long promptTokens, long completionTokens,
                          BigDecimal costUsd, long costVnd, long costPerTurnVnd,
                          double answeredByAiRate, double degradedRate, double handoffSuggestedRate,
                          long emergencies, long outputBlocked, long feedbackUp, long feedbackDown,
                          Double satisfactionRate, long supportTickets, long staffReplies, Double aiDraftUsedRate,
                          Map<String, Long> toolUsage, List<DailyPoint> daily, String pricingNote) {
    }

    public record ConversationSummary(Long id, String patientName, String title, long turns,
                                      LocalDateTime startedAt, LocalDateTime lastAt, BigDecimal costUsd, long costVnd,
                                      long avgLatencyMs, long upvotes, long downvotes, boolean handoff,
                                      boolean emergency, boolean degraded, boolean outputBlocked) {
    }

    public record MessageTrace(Long id, String role, String content, LocalDateTime createdAt, String source,
                               String model, List<String> toolCalls, Integer promptTokens, Integer completionTokens,
                               BigDecimal costUsd, Long latencyMs, String emergencyCategory, boolean handoffSuggested,
                               boolean degraded, boolean outputBlocked, List<String> citations, String feedback,
                               String feedbackComment) {
    }

    public record ConversationTrace(Long id, String patientName, String patientEmail, LocalDateTime startedAt,
                                    List<MessageTrace> messages) {
    }
}
