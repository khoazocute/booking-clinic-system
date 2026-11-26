package com.example.booking_clinic.dto.ai;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contract test: deserialize JSON exactly as AI_Service (FastAPI) produces it, with the same
 * Jackson 3 defaults RestClient uses. Mock-based tests cannot catch wire-format mismatches.
 */
class AiServiceContractTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    static final String CHAT_JSON = """
            {"answer":"Huỷ trong 6-24 giờ được hoàn 40% [K1].","emergency":null,
             "citations":[{"ref":"K1","title":"Chính sách huỷ lịch và hoàn tiền","sourceType":"FAQ","sourceId":null}],
             "doctors":[{"id":2,"fullName":"Trần Minh Khang","specialtyId":5,"specialtyName":"Tai mũi họng",
                         "experienceYears":6,"qualification":"x","averageRating":5.0,"consultationFee":250.00,"clinicRoom":"P303"}],
             "slots":[{"scheduleId":21,"doctorId":2,"workDate":"2026-11-24","startTime":"08:00","endTime":"08:30"}],
             "bookingProposal":null,"handoffSuggested":true,"handoffReason":"PAYMENT_ISSUE","toolCalls":["search_clinic_knowledge"],"model":"openai/gpt-4.1-mini",
             "promptTokens":2345,"completionTokens":67}
            """;

    @Test
    void parsesAiServiceChatResponse() {
        AiServiceChatResult result = assertDoesNotThrow(() -> mapper.readValue(CHAT_JSON, AiServiceChatResult.class));
        AiChatResponse response = result.toResponse();

        assertEquals("K1", response.citations().get(0).ref());
        assertEquals("Trần Minh Khang", response.doctors().get(0).fullName());
        assertEquals(21L, response.slots().get(0).scheduleId());
        assertFalse(response.degraded());
        assertEquals("ai-service", response.source());
        assertTrue(response.suggestions().isEmpty());
        assertTrue(response.handoffSuggested());
        assertEquals("PAYMENT_ISSUE", response.handoffReason());
    }

    @Test
    void olderAiServiceWithoutHandoffFieldsStillParses() {
        String json = CHAT_JSON.replace("\"handoffSuggested\":true,\"handoffReason\":\"PAYMENT_ISSUE\",", "");
        AiChatResponse response = assertDoesNotThrow(() -> mapper.readValue(json, AiServiceChatResult.class)).toResponse();
        assertFalse(response.handoffSuggested());
    }

    @Test
    void rootCause_publicDtoCannotBeTheWireContract() {
        // AiChatResponse has a primitive `degraded` that AI_Service never sends; Jackson 3 rejects that.
        assertThrows(Exception.class, () -> mapper.readValue(CHAT_JSON, AiChatResponse.class));
    }

    @Test
    void parsesTriageResponseWithEmergency() {
        String json = """
                {"emergency":{"category":"STROKE","message":"Gọi 115"},"refused":true,"answer":"Gọi 115",
                 "suggestions":[],"piiRedacted":0,"router":"bm25+profiles"}
                """;
        AiTriageResult result = assertDoesNotThrow(() -> mapper.readValue(json, AiTriageResult.class));
        assertEquals("STROKE", result.emergency().category());
    }
}
