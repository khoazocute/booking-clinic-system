package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.service.AiEmbeddingService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Primary
public class FakeAiEmbeddingServiceImpl implements AiEmbeddingService {

    /**
     * Keyword lists per category, in vector order. The last vector dimension is a constant
     * "general" bias, which {@code AiConsultationServiceImpl#hasClinicalSignal} relies on.
     */
    private static final List<List<String>> CATEGORY_KEYWORDS = List.of(
            List.of("tim", "dau nguc", "kho tho", "huyet ap", "hoi hop", "roi loan nhip"),                          // cardio
            List.of("da", "mun", "ngua", "noi man", "viem da", "di ung da", "phat ban", "nam da"),                    // skin
            List.of("tai", "mui", "hong", "ho", "dau hong", "nghet mui", "so mui", "u tai", "dau tai", "viem xoang"), // ENT
            List.of("dau dau", "chong mat", "co giat", "mat ngu", "te tay", "te chan", "dau nua dau"),               // neuro
            List.of("tre em", "em be", "be", "nhi", "tre so sinh", "bieng an"),                                      // pediatric
            List.of("ho keo dai", "kho tho", "dau tuc nguc", "viem phoi", "hen suyen", "viem phe quan"),             // respiratory
            List.of("dau bung", "buon non", "non oi", "oi", "tieu chay", "tao bon", "dau da day", "trao nguoc",
                    "roi loan tieu hoa"),                                                                             // digestive
            List.of("dau lung", "dau vai gay", "dau khop", "te bi", "viem khop", "thoai hoa khop", "chan thuong"),    // musculoskeletal
            List.of("phu khoa", "san khoa", "roi loan kinh nguyet", "dau bung kinh", "khi hu", "mang thai", "thai ky",
                    "kham thai"),                                                                                     // obstetrics
            List.of("ung thu", "u buou", "khoi u", "sut can", "hach", "tam soat ung thu", "dau keo dai")             // oncology
    );

    /** keyword -> categories it belongs to, longest keyword first (so "dau da day" wins over "da"). */
    private static final List<Map.Entry<String, List<Integer>>> KEYWORDS_LONGEST_FIRST = buildKeywordIndex();

    private static final String CONSUMED = " | ";

    @Override
    public List<Double> embed(String text) {
        // Pad with spaces so every keyword is matched as " keyword ", i.e. whole words only.
        // The previous version used text.contains(keyword), so "ho" matched inside "khong",
        // "da" inside "dau", "tai" inside "trai", etc.
        String remaining = " " + normalize(text) + " ";
        double[] vector = new double[CATEGORY_KEYWORDS.size() + 1];

        for (Map.Entry<String, List<Integer>> entry : KEYWORDS_LONGEST_FIRST) {
            String needle = " " + entry.getKey() + " ";
            if (!remaining.contains(needle)) {
                continue;
            }
            // Consume the matched words so a shorter keyword cannot re-match inside a longer
            // one that was already counted (e.g. "da" inside "dau da day", "ho" inside "ho keo dai").
            remaining = remaining.replace(needle, CONSUMED);
            for (int category : entry.getValue()) {
                vector[category] += 1.0;
            }
        }

        vector[CATEGORY_KEYWORDS.size()] = 1.0; // general
        return Arrays.stream(vector).boxed().toList();
    }

    private static List<Map.Entry<String, List<Integer>>> buildKeywordIndex() {
        Map<String, List<Integer>> index = new LinkedHashMap<>();
        for (int category = 0; category < CATEGORY_KEYWORDS.size(); category++) {
            for (String keyword : CATEGORY_KEYWORDS.get(category)) {
                index.computeIfAbsent(keyword, k -> new ArrayList<>()).add(category);
            }
        }
        List<Map.Entry<String, List<Integer>>> entries = new ArrayList<>(index.entrySet());
        entries.sort(Comparator.comparingInt((Map.Entry<String, List<Integer>> e) -> e.getKey().length()).reversed());
        return List.copyOf(entries);
    }

    /** Lower-case, strip Vietnamese diacritics, and turn punctuation into word separators. */
    static String normalize(String text) {
        if (text == null) {
            return "";
        }

        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');

        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
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
