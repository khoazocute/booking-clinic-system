package com.example.booking_clinic.event;

/** Published when data the AI knowledge base is built from (specialties, doctors) changes. */
public record AiKnowledgeChangedEvent(String reason) {
}
