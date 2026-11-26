package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.AiMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    /** Most recent first; callers reverse for chronological order. */
    List<AiMessage> findByConversation_IdOrderByIdDesc(Long conversationId, Pageable page);

    List<AiMessage> findByConversation_IdOrderByIdAsc(Long conversationId);

    @EntityGraph(attributePaths = {"conversation", "conversation.user"})
    List<AiMessage> findByCreatedAtAfter(LocalDateTime after);
}
