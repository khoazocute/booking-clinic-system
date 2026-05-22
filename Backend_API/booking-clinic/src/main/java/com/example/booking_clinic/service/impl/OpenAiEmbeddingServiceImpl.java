package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.AiEmbeddingService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.List;

@Service
@Profile("openai")
@RequiredArgsConstructor
public class OpenAiEmbeddingServiceImpl implements AiEmbeddingService {

    @Value("${app.openai.api-key}")
    private String apiKey;

    @Value("${app.openai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    @Override
    public List<Double> embed(String text) {
        RestClient client = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();

        EmbeddingResponse response = client.post()
                .uri("/embeddings")
                .body(new EmbeddingRequest(embeddingModel, text == null ? "" : text))
                .retrieve()
                .body(EmbeddingResponse.class);

        if (response == null || response.data() == null || response.data().isEmpty()) {
            throw new IllegalStateException("OpenAI embedding response is empty");
        }

        return response.data().get(0).embedding();
    }

    @Override
    public String serialize(List<Double> vector) {
        return vector.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse("");
    }

    @Override
    public List<Double> deserialize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(","))
                .map(Double::parseDouble)
                .toList();
    }

    @Override
    public double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a.size() != b.size() || a.isEmpty()) {
            return 0.0;
        }

        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.size(); i++) {
            dot += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }

        if (normA == 0 || normB == 0) {
            return 0.0;
        }

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private record EmbeddingRequest(
            String model,
            String input
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record EmbeddingResponse(
            List<EmbeddingData> data
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record EmbeddingData(
            List<Double> embedding
    ) {
    }
}
