package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.service.AiEmbeddingService;
import com.example.booking_clinic.service.AiKnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiKnowledgeServiceImpl implements AiKnowledgeService {

    private final AiDocumentRepository aiDocumentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final AiEmbeddingService aiEmbeddingService;

    @Override
    @Transactional
    public int rebuildIndex() {
        // Embed everything first: if the embedding provider fails, the old index is kept
        // instead of being wiped.
        List<AiDocument> documents = new ArrayList<>();

        for (Specialty specialty : specialtyRepository.findAll()) {
            String content = "Chuyen khoa " + specialty.getName()
                    + ". Mo ta: " + nullToEmpty(specialty.getDescription());

            documents.add(buildDocument(
                    "SPECIALTY",
                    specialty.getId(),
                    specialty.getName(),
                    content
            ));
        }

        aiDocumentRepository.deleteAll();
        aiDocumentRepository.saveAll(documents);
        return documents.size();
    }

    private AiDocument buildDocument(String sourceType, Long sourceId, String title, String content) {
        List<Double> vector = aiEmbeddingService.embed(content);

        return AiDocument.builder()
                .sourceType(sourceType)
                .sourceId(sourceId)
                .title(title)
                .content(content)
                .embedding(aiEmbeddingService.serialize(vector))
                .build();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    /**
     * The index is derived data (specialty descriptions -> vectors), so it is always rebuilt on
     * startup. Otherwise vectors computed by an older embedding version (e.g. the ones seeded in
     * db_init/init.sql) would silently disagree with how queries are embedded now.
     */
    @jakarta.annotation.PostConstruct
    public void init() {
        rebuildIndex();
    }
}
