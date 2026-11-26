package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiSuggestionResponse;
import com.example.booking_clinic.dto.ai.AiTriageResult;
import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiEmbeddingService;
import com.example.booking_clinic.service.AiServiceGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Specialty triage. Delegates to the Python AI_Service (red-flag rules + evaluated router) and falls
 * back to the local keyword router when AI_Service is disabled or unreachable, so the feature never
 * goes down with it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiConsultationServiceImpl implements AiConsultationService {

    private final AiDocumentRepository aiDocumentRepository;
    private final AiEmbeddingService aiEmbeddingService;
    private final AiServiceGateway aiServiceGateway;

    @Override
    public AiConsultResponse consult(AiConsultRequest request) {
        if (aiServiceGateway.isEnabled()) {
            try {
                return fromAiService(aiServiceGateway.triage(request.message()));
            } catch (AiServiceUnavailableException e) {
                log.warn("AI_Service triage unavailable, using local keyword router: {}", e.getMessage());
            }
        }
        return consultLocally(request);
    }

    private AiConsultResponse fromAiService(AiTriageResult result) {
        List<AiSuggestionResponse> suggestions = result.suggestions() == null ? List.of() : result.suggestions().stream()
                .map(s -> new AiSuggestionResponse("SPECIALTY", s.specialtyId(), s.name(), "", s.score()))
                .toList();
        return new AiConsultResponse(result.answer(), suggestions, result.emergency(), "ai-service");
    }

    /** Local keyword router (no emergency detection): only used when AI_Service is unavailable. */
    AiConsultResponse consultLocally(AiConsultRequest request) {
        List<Double> queryVector = aiEmbeddingService.embed(request.message());

        if (!hasClinicalSignal(queryVector)) {
            return new AiConsultResponse(
                    "Toi chua nhan dien duoc trieu chung y khoa trong noi dung ban nhap. Ban hay mo ta ro hon, vi du: dau dau, dau nguc, kho tho, ngua da, dau bung...",
                    List.of()
            );
        }

        List<AiSuggestionResponse> suggestions = aiDocumentRepository.findAll()
                .stream()
                .filter(document -> "SPECIALTY".equalsIgnoreCase(document.getSourceType()))
                .map(document -> toSuggestion(document, queryVector))
                .sorted(Comparator.comparingDouble(AiSuggestionResponse::score).reversed())
                .limit(5)
                .toList();

        String answer = buildAnswer(suggestions);

        return new AiConsultResponse(answer, suggestions);
    }

    private boolean hasClinicalSignal(List<Double> vector) {
        if (vector == null || vector.size() <= 1) {
            return false;
        }

        for (int i = 0; i < vector.size() - 1; i++) {
            if (vector.get(i) > 0) {
                return true;
            }
        }

        return false;
    }

    private AiSuggestionResponse toSuggestion(AiDocument document, List<Double> queryVector) {
        List<Double> documentVector = aiEmbeddingService.deserialize(document.getEmbedding());
        double score = aiEmbeddingService.cosineSimilarity(queryVector, documentVector);

        return new AiSuggestionResponse(
                document.getSourceType(),
                document.getSourceId(),
                document.getTitle(),
                document.getContent(),
                score
        );
    }

    private String buildAnswer(List<AiSuggestionResponse> suggestions) {
        if (suggestions.isEmpty() || suggestions.get(0).score() <= 0) {
            return "Toi chua tim thay chuyen khoa that su phu hop. Ban nen dat lich kham tong quat de duoc tu van them.";
        }

        AiSuggestionResponse best = suggestions.get(0);

        return "Dua tren trieu chung ban mo ta, toi goi y ban tham khao "
                + best.title()
                + ". Day chi la goi y ho tro dat lich, khong thay the chan doan y khoa.";
    }
}
