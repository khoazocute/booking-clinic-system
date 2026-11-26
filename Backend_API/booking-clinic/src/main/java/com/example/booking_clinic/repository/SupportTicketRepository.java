package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.SupportTicket;
import com.example.booking_clinic.entity.enums.SupportTicketStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Optional<SupportTicket> findFirstByPatient_IdAndStatusInOrderByCreatedAtDesc(Long userId,
                                                                               Collection<SupportTicketStatus> statuses);

    @EntityGraph(attributePaths = {"patient", "assignedStaff"})
    List<SupportTicket> findByStatusInOrderByUpdatedAtDesc(Collection<SupportTicketStatus> statuses);

    @EntityGraph(attributePaths = {"patient", "assignedStaff"})
    List<SupportTicket> findAllByOrderByUpdatedAtDesc();

    long countByCreatedAtAfter(java.time.LocalDateTime after);
}
