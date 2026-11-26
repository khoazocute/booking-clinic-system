package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.common.exception.TooManyRequestsException;
import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiChatRequest;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiEmergency;
import com.example.booking_clinic.dto.ai.AiServiceChatResult;
import com.example.booking_clinic.dto.ai.AiSuggestionResponse;
import com.example.booking_clinic.entity.AiMessage;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiRateLimiter;
import com.example.booking_clinic.service.AiServiceGateway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatServiceImplTest {

    private AiServiceGateway gateway;
    private AiConsultationService consultation;
    private AiRateLimiter rateLimiter;
    private AiConversationStore store;
    private AiChatServiceImpl service;

    private static final List<AiChatMessage> HISTORY = List.of(
            new AiChatMessage("user", "Tôi bị đau họng"),
            new AiChatMessage("assistant", "Bạn nên khám Tai mũi họng."),
            new AiChatMessage("user", "Có bác sĩ nào?"));

    @BeforeEach
    void setUp() {
        gateway = mock(AiServiceGateway.class);
        consultation = mock(AiConsultationService.class);
        rateLimiter = mock(AiRateLimiter.class);
        store = mock(AiConversationStore.class);
        service = new AiChatServiceImpl(gateway, consultation, rateLimiter, store);

        loginAs(42L);
        when(rateLimiter.consumeDailyQuota(anyString())).thenReturn(AiRateLimiter.Quota.OK);
        when(store.appendUserMessage(eq(42L), any(), anyString())).thenReturn(new AiConversationStore.Opened(7L, HISTORY));
        when(store.saveAssistant(anyLong(), any(), any())).thenReturn(AiMessage.builder().id(99L).build());
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private static void loginAs(long id) {
        User principal = User.builder().id(id).email("p" + id + "@example.test").build();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    private static AiServiceChatResult aiAnswer(String answer) {
        return new AiServiceChatResult(answer, null, null, null, null, null, false, null, false,
                List.of("suggest_specialty", "find_doctors"), "openai/gpt-4.1-mini", 2000, 80);
    }

    private static AiChatRequest ask(String text) {
        return new AiChatRequest(null, text);
    }

    @Test
    void historySentToTheModelComesFromTheDatabaseNotTheClient() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.chat(anyList())).thenReturn(aiAnswer("Có BS. Khang."));

        AiChatResponse response = service.chat(ask("Có bác sĩ nào?"));

        verify(gateway).chat(HISTORY);
        assertEquals(7L, response.conversationId());
        assertEquals(99L, response.messageId());
        assertEquals("ai-service", response.source());
        assertEquals(List.of(), response.doctors()); // nulls normalised for the UI
    }

    @Test
    void telemetryIsRecordedForTheDashboard() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.chat(anyList())).thenReturn(aiAnswer("Có BS. Khang."));
        ArgumentCaptor<AiConversationStore.Telemetry> telemetry = ArgumentCaptor.forClass(AiConversationStore.Telemetry.class);

        service.chat(ask("Có bác sĩ nào?"));

        verify(store).saveAssistant(eq(7L), any(), telemetry.capture());
        assertEquals("openai/gpt-4.1-mini", telemetry.getValue().model());
        assertEquals(List.of("suggest_specialty", "find_doctors"), telemetry.getValue().toolCalls());
        assertEquals(2000, telemetry.getValue().promptTokens());
        assertTrue(telemetry.getValue().latencyMs() >= 0);
    }

    @Test
    void streamingForwardsProgressAndIsLabelledAsStream() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.chatStream(anyList(), any())).thenAnswer(invocation -> {
            java.util.function.Consumer<Map<String, Object>> progress = invocation.getArgument(1);
            progress.accept(Map.of("type", "status", "tool", "find_doctors"));
            progress.accept(Map.of("type", "delta", "text", "Có BS. Khang."));
            return aiAnswer("Có BS. Khang.");
        });
        List<Map<String, Object>> events = new ArrayList<>();

        AiChatResponse response = service.complete(service.prepare(ask("Có bác sĩ nào?")), events::add);

        assertEquals(2, events.size());
        assertEquals("ai-service-stream", response.source());
        verify(gateway, never()).chat(anyList());
    }

    @Test
    void degradesToTriageWhenChatIsUnavailableAndStillOffersAHuman() {
        when(gateway.isEnabled()).thenReturn(true);
        when(gateway.chat(anyList())).thenThrow(new AiServiceUnavailableException("chat model down", null));
        when(consultation.consult(any())).thenReturn(new AiConsultResponse("Gợi ý: Tai mũi họng.",
                List.of(new AiSuggestionResponse("SPECIALTY", 5L, "Tai mũi họng", "", 3.0)), null, "ai-service"));

        AiChatResponse response = service.chat(ask("đau họng"));

        assertTrue(response.degraded());
        assertTrue(response.answer().endsWith(AiChatServiceImpl.DEGRADED_NOTE));
        assertEquals(5L, response.suggestions().get(0).sourceId());
        assertTrue(response.handoffSuggested());
        assertEquals("AI_UNAVAILABLE", response.handoffReason());
        assertEquals(99L, response.messageId()); // degraded turns are recorded too
    }

    @Test
    void degradedEmergencyAnswerIsNotDilutedAndOffersNoTicket() {
        when(gateway.isEnabled()).thenReturn(false);
        when(consultation.consult(any())).thenReturn(new AiConsultResponse("Gọi 115 ngay.", List.of(),
                new AiEmergency("CARDIAC", "Gọi 115 ngay."), "ai-service"));

        AiChatResponse response = service.chat(ask("đau thắt ngực dữ dội"));

        assertEquals("Gọi 115 ngay.", response.answer());
        assertEquals("CARDIAC", response.emergency().category());
        assertFalse(response.handoffSuggested());
    }

    @Test
    void rateLimitIsCheckedBeforeAnythingIsSavedOrCalled() {
        doThrow(new TooManyRequestsException("slow down")).when(rateLimiter).check(anyString());

        assertThrows(TooManyRequestsException.class, () -> service.chat(ask("đau họng")));
        verify(store, never()).appendUserMessage(anyLong(), any(), anyString());
        verify(gateway, never()).chat(anyList());
    }

    @Test
    void userOverTheDailyQuotaGetsAClearMessageAndNothingIsSaved() {
        when(gateway.isEnabled()).thenReturn(true);
        when(rateLimiter.consumeDailyQuota(anyString())).thenReturn(AiRateLimiter.Quota.USER_EXCEEDED);

        TooManyRequestsException error = assertThrows(TooManyRequestsException.class, () -> service.chat(ask("đau họng")));
        assertEquals(AiChatServiceImpl.DAILY_LIMIT_MESSAGE, error.getMessage());
        verify(store, never()).appendUserMessage(anyLong(), any(), anyString());
    }

    @Test
    void systemOverTheDailyBudgetDegradesToTheFreeRouterInsteadOfFailing() {
        when(gateway.isEnabled()).thenReturn(true);
        when(rateLimiter.consumeDailyQuota(anyString())).thenReturn(AiRateLimiter.Quota.GLOBAL_EXCEEDED);
        when(consultation.consult(any())).thenReturn(new AiConsultResponse("Gợi ý: Tai mũi họng.", List.of(), null, "fallback-keyword"));

        AiChatResponse response = service.chat(ask("đau họng"));

        assertTrue(response.degraded());
        verify(gateway, never()).chat(anyList());
    }

    @Test
    void rateLimitKeyIsStableAcrossRequestsForTheSamePatient() {
        for (int i = 0; i < 2; i++) {
            loginAs(42L); // a new principal instance per request, as the JWT filter does
            assertEquals("user:42", service.currentUserKey());
        }
    }

    @Test
    void conversationIdFromTheClientIsCheckedByTheStore() {
        when(gateway.isEnabled()).thenReturn(false);
        when(consultation.consult(any())).thenReturn(new AiConsultResponse("ok", List.of(), null, "fallback-keyword"));

        service.chat(new AiChatRequest(7L, "tiếp"));

        verify(store).appendUserMessage(42L, 7L, "tiếp");
        verify(store, never()).appendUserMessage(eq(42L), isNull(), anyString());
    }
}
