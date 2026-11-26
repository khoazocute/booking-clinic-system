package com.example.booking_clinic.ai.eval;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * One labelled query in the specialty-routing eval set.
 *
 * @param split    "dev" (allowed to look at failures / tune on) or "test" (report only)
 * @param expected acceptable specialty names; empty for OUT_OF_SCOPE and for red flags
 *                 where routing to a specialty is not meaningful
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EvalCase(
        String id,
        String split,
        CaseType type,
        String query,
        List<String> expected,
        String note
) {

    public enum CaseType {
        /** A clinical question that should be routed to one of {@code expected}. */
        ANSWERABLE,
        /** Non-clinical / not allowed (prescribing, chit-chat): the system must NOT suggest a specialty. */
        OUT_OF_SCOPE,
        /** Emergency symptoms: the system must flag them and direct the user to emergency care. */
        RED_FLAG
    }
}
