package com.example.booking_clinic.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One turn. Assistant turns also carry the telemetry behind the LLMOps dashboard: which path answered,
 * tools called, tokens, estimated cost, latency, guardrail outcomes and the patient's feedback.
 */
@Entity
@Table(name = "ai_messages", indexes = {
        @Index(name = "idx_ai_msg_conv", columnList = "conversation_id,id"),
        @Index(name = "idx_ai_msg_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    /** user | assistant */
    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // ---------- assistant telemetry ----------

    /** ai-service, ai-service-stream, fallback-keyword, ... */
    @Column(length = 30)
    private String source;

    @Column(length = 60)
    private String model;

    /** comma-separated tool names, in call order */
    @Column(name = "tool_calls", length = 500)
    private String toolCalls;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "cost_usd", precision = 12, scale = 6)
    private BigDecimal costUsd;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "emergency_category", length = 40)
    private String emergencyCategory;

    @Column(name = "handoff_suggested")
    private Boolean handoffSuggested;

    @Column
    private Boolean degraded;

    @Column(name = "output_blocked")
    private Boolean outputBlocked;

    @Column(name = "citation_count")
    private Integer citationCount;

    /** The structured response (doctors, slots, proposal, citations...) so the UI can re-render it after a reload. */
    @Column(name = "artifacts_json", columnDefinition = "MEDIUMTEXT")
    private String artifactsJson;

    /** UP | DOWN */
    @Column(length = 4)
    private String feedback;

    @Column(name = "feedback_comment", length = 500)
    private String feedbackComment;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
