package com.example.booking_clinic.ai.eval;

import java.util.List;

/**
 * Anything that maps a free-text patient message to a ranked list of specialties.
 * Every approach we compare (keyword baseline, embeddings, hybrid, hybrid + rerank)
 * implements this, so they are all scored by the same {@link RoutingEvaluator}.
 */
public interface SpecialtyRouter {

    String name();

    Result route(String query);

    /**
     * @param refused  the system declined to suggest any specialty
     * @param redFlag  the system detected an emergency and escalated
     * @param ranked   specialty names, best first (may be empty when refused)
     * @param scores   similarity score per entry of {@code ranked}
     */
    record Result(boolean refused, boolean redFlag, List<String> ranked, List<Double> scores) {
    }
}
