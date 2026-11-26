package com.example.booking_clinic.entity;

import com.example.booking_clinic.entity.enums.SupportTicketStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A patient's request to talk to clinic staff, usually handed off from the AI assistant.
 * Linked to the user (not the patient profile) so patients without a completed profile can still ask for help.
 */
@Entity
@Table(name = "support_tickets", indexes = {
        @Index(name = "idx_support_ticket_user_status", columnList = "user_id,status"),
        @Index(name = "idx_support_ticket_status_updated", columnList = "status,updated_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportTicketStatus status;

    /** Why the handoff happened: PATIENT_REQUEST, COMPLAINT, PAYMENT_ISSUE, OUT_OF_SCOPE, AGENT_GAVE_UP, AI_UNAVAILABLE. */
    @Column(nullable = false, length = 30)
    private String reason;

    /** The AI conversation the patient chose to share, so staff don't ask again. Null if not shared. */
    @Column(name = "ai_transcript", columnDefinition = "TEXT")
    private String aiTranscript;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
