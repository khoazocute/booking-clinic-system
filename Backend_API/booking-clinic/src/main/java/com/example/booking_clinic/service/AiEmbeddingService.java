package com.example.booking_clinic.service;

import java.util.List;

public interface AiEmbeddingService {
    List<Double> embed(String text);
    String serialize(List<Double> vector);
    List<Double> deserialize(String value);
    double cosineSimilarity(List<Double> a, List<Double> b);
}