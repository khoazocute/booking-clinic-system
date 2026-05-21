package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiSuggestionResponse;
import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiEmbeddingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiConsultationServiceImpl implements AiConsultationService {

    private final AiDocumentRepository aiDocumentRepository;
    private final AiEmbeddingService aiEmbeddingService;

    @Override
    public AiConsultResponse consult(AiConsultRequest request) {
        List<Double> queryVector = aiEmbeddingService.embed(request.message());

        if (!hasClinicalSignal(queryVector)) {
            return new AiConsultResponse(
                    "Toi chua nhan dien duoc trieu chung y khoa trong noi dung ban nhap. Ban hay mo ta ro hon, vi du: dau dau, dau nguc, kho tho, ngua da, dau bung...",
                    List.of()
            );
        }

        List<AiSuggestionResponse> suggestions = aiDocumentRepository.findAll()
                .stream()
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
            return "Tôi chưa tìm thấy chuyên khoa thật sự phù hợp. Bạn nên đặt lịch khám tổng quát để được tư vấn thêm.";
        }

        AiSuggestionResponse best = suggestions.get(0);

        return "Dựa trên triệu chứng bạn mô tả, tôi gợi ý bạn tham khảo "
                + best.title()
                + ". Đây chỉ là gợi ý hỗ trợ đặt lịch, không thay thế chẩn đoán y khoa.";
    }
}
