package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.SupportMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    @EntityGraph(attributePaths = {"sender"})
    List<SupportMessage> findByTicket_IdOrderByCreatedAtAsc(Long ticketId);

    Optional<SupportMessage> findFirstByTicket_IdOrderByCreatedAtDesc(Long ticketId);

    long countBySenderRoleAndCreatedAtAfter(String senderRole, java.time.LocalDateTime after);

    long countBySenderRoleAndAiAssistedTrueAndCreatedAtAfter(String senderRole, java.time.LocalDateTime after);
}
