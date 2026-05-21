package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.AiEmbeddingService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class FakeAiEmbeddingServiceImpl implements AiEmbeddingService {

    @Override
    public List<Double> embed(String text) {
        String value = normalize(text);

        double cardio = score(value, List.of("tim", "đau ngực", "dau nguc", "khó thở", "kho tho", "huyết áp", "huyet ap"));
        double skin = score(value, List.of("da", "mụn", "mun", "ngứa", "ngua", "nổi mẩn", "noi man", "viêm da", "viem da"));
        double ent = score(value, List.of("tai", "mũi", "mui", "họng", "hong", "ho", "đau họng", "dau hong", "nghẹt mũi", "nghet mui"));
        double neuro = score(value, List.of("đau đầu", "dau dau", "chóng mặt", "chong mat", "co giật", "co giat", "mất ngủ", "mat ngu"));
        double pediatric = score(value, List.of("trẻ em", "tre em", "em bé", "em be", "bé", "be", "nhi"));
        double general = 1.0;

        return List.of(cardio, skin, ent, neuro, pediatric, general);
    }

    private String normalize(String text) {
        return text == null ? "" : text.toLowerCase();
    }

    private double score(String text, List<String> keywords) {
        double total = 0.0;
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase())) {
                total += 1.0;
            }
        }
        return total;
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
}