package com.example.booking_clinic.ai.eval;

import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiSuggestionResponse;
import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.service.AiEmbeddingService;
import com.example.booking_clinic.service.AiServiceGateway;
import com.example.booking_clinic.service.impl.AiConsultationServiceImpl;
import com.example.booking_clinic.service.impl.AiKnowledgeServiceImpl;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Runs the REAL production code path ({@link AiKnowledgeServiceImpl#rebuildIndex()} +
 * {@link AiConsultationServiceImpl#consult}) with the database replaced by in-memory mocks,
 * so the eval measures exactly what a patient gets from {@code POST /api/v1/ai/consult}.
 */
public class ConsultationServiceRouter implements SpecialtyRouter {

    private final String name;
    private final AiConsultationServiceImpl consultationService;

    public ConsultationServiceRouter(String name, AiEmbeddingService embeddingService, List<Specialty> specialties) {
        this.name = name;

        List<AiDocument> index = new ArrayList<>();
        AiDocumentRepository documentRepository = mock(AiDocumentRepository.class);
        SpecialtyRepository specialtyRepository = mock(SpecialtyRepository.class);

        when(specialtyRepository.findAll()).thenReturn(specialties);
        when(documentRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<AiDocument> saved = invocation.getArgument(0);
            index.clear();
            index.addAll(saved);
            return saved;
        });
        when(documentRepository.findAll()).thenReturn(index);

        new AiKnowledgeServiceImpl(documentRepository, specialtyRepository, embeddingService).rebuildIndex();
        // AI_Service disabled: this measures the backend's local keyword fallback
        this.consultationService = new AiConsultationServiceImpl(
                documentRepository, embeddingService, mock(AiServiceGateway.class));
    }

    @Override
    public String name() {
        return name;
    }

    @Override
    public Result route(String query) {
        AiConsultResponse response = consultationService.consult(new AiConsultRequest(query));
        List<AiSuggestionResponse> suggestions = response.suggestions();

        // Mirrors AiConsultationServiceImpl: no suggestions, or a non-positive best score,
        // means the patient is told "no suitable specialty found".
        boolean refused = suggestions.isEmpty() || suggestions.get(0).score() <= 0;

        return new Result(
                refused,
                false, // the current system has no emergency detection at all
                suggestions.stream().map(AiSuggestionResponse::title).toList(),
                suggestions.stream().map(AiSuggestionResponse::score).toList()
        );
    }
}
