package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiEmergency;
import com.example.booking_clinic.dto.ai.AiTriageResult;
import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.service.AiServiceGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiConsultationServiceImplTest {

    private final FakeAiEmbeddingServiceImpl embedding = new FakeAiEmbeddingServiceImpl();
    private AiDocumentRepository documents;
    private AiServiceGateway gateway;
    private AiConsultationServiceImpl service;

    @BeforeEach
    void setUp() {
        documents = mock(AiDocumentRepository.class);
        gateway = mock(AiServiceGateway.class);
        String text = "Chuyen khoa Tieu hoa. Mo ta: dau bung, dau da day";
        when(documents.findAll()).thenReturn(List.of(AiDocument.builder()
                .sourceType("SPECIALTY").sourceId(9L).title("Tiêu hóa").content(text)
                .embedding(embedding.serialize(embedding.embed(text))).build()));
        service = new AiConsultationServiceImpl(documents, embedding, gateway);
    }

    @Test
    void usesAiServiceAndPassesEmergencyThrough() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.triage(anyString())).thenReturn(new AiTriageResult(
                new AiEmergency("STROKE", "Gọi 115 ngay"), true, "Gọi 115 ngay", List.of(), "bm25"));

        AiConsultResponse response = service.consult(new AiConsultRequest("méo miệng, yếu nửa người"));

        assertEquals("ai-service", response.source());
        assertEquals("STROKE", response.emergency().category());
        assertEquals(List.of(), response.suggestions());
    }

    @Test
    void mapsAiServiceSuggestions() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.triage(anyString())).thenReturn(new AiTriageResult(null, false, "Tiêu hóa",
                List.of(new AiTriageResult.Suggestion(9L, "Tiêu hóa", 7.1)), "bm25"));

        AiConsultResponse response = service.consult(new AiConsultRequest("ợ chua"));

        assertEquals(9L, response.suggestions().get(0).sourceId());
        assertEquals("SPECIALTY", response.suggestions().get(0).sourceType());
    }

    @Test
    void fallsBackToLocalKeywordRouterWhenAiServiceIsDown() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.triage(anyString())).thenThrow(new AiServiceUnavailableException("timeout", null));

        AiConsultResponse response = service.consult(new AiConsultRequest("Tôi bị đau dạ dày"));

        assertEquals("fallback-keyword", response.source());
        assertEquals("Tiêu hóa", response.suggestions().get(0).title());
        assertNull(response.emergency());
    }

    @Test
    void doesNotCallAiServiceWhenDisabled() {
        when(gateway.isEnabled()).thenReturn(false);

        service.consult(new AiConsultRequest("Tôi bị đau dạ dày"));

        verify(gateway, never()).triage(anyString());
    }
}
