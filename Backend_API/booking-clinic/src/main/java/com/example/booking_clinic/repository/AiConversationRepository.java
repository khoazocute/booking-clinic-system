package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    Optional<AiConversation> findFirstByUser_IdAndUpdatedAtAfterOrderByUpdatedAtDesc(Long userId, LocalDateTime after);
}
