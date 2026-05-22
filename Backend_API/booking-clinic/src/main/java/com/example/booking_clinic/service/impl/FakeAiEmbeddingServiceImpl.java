package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.AiEmbeddingService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@Primary
public class FakeAiEmbeddingServiceImpl implements AiEmbeddingService {

    @Override
    public List<Double> embed(String text) {
        String value = normalize(text);

        double cardio = score(value, List.of("tim", "dau nguc", "kho tho", "huyet ap", "hoi hop", "roi loan nhip"));
        double skin = score(value, List.of("da", "mun", "ngua", "noi man", "viem da", "di ung da", "phat ban", "nam da"));
        double ent = score(value, List.of("tai", "mui", "hong", "ho", "dau hong", "nghet mui", "so mui", "u tai", "dau tai", "viem xoang"));
        double neuro = score(value, List.of("dau dau", "chong mat", "co giat", "mat ngu", "te tay", "te chan", "dau nua dau"));
        double pediatric = score(value, List.of("tre em", "em be", "be", "nhi", "tre so sinh", "bieng an"));
        double respiratory = score(value, List.of("ho keo dai", "kho tho", "dau tuc nguc", "viem phoi", "hen suyen", "viem phe quan"));
        double digestive = score(value, List.of("dau bung", "buon non", "non oi", "oi", "tieu chay", "tao bon", "dau da day", "trao nguoc", "roi loan tieu hoa"));
        double musculoskeletal = score(value, List.of("dau lung", "dau vai gay", "dau khop", "te bi", "viem khop", "thoai hoa khop", "chan thuong"));
        double obstetrics = score(value, List.of("phu khoa", "san khoa", "roi loan kinh nguyet", "dau bung kinh", "khi hu", "mang thai", "thai ky", "kham thai"));
        double oncology = score(value, List.of("ung thu", "u buou", "khoi u", "sut can", "hach", "tam soat ung thu", "dau keo dai"));
        double general = 1.0;

        return List.of(
                cardio,
                skin,
                ent,
                neuro,
                pediatric,
                respiratory,
                digestive,
                musculoskeletal,
                obstetrics,
                oncology,
                general
        );
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');

        return normalized.toLowerCase(Locale.ROOT);
    }

    private double score(String text, List<String> keywords) {
        double total = 0.0;
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
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
