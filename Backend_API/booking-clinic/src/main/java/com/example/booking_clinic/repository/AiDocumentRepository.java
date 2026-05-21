package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.AiDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiDocumentRepository extends JpaRepository<AiDocument, Long> {
    void deleteBySourceType(String sourceType);
}