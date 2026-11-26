package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiConversationViews.Metrics;
import com.example.booking_clinic.entity.AiConversation;
import com.example.booking_clinic.entity.AiMessage;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.AiConversationRepository;
import com.example.booking_clinic.repository.AiMessageRepository;
import com.example.booking_clinic.repository.SupportMessageRepository;
import com.example.booking_clinic.repository.SupportTicketRepository;
import com.example.booking_clinic.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiInsightsAndStoreTest {

    private final AiCostEstimator costs = new AiCostEstimator(new BigDecimal("0.40"), new BigDecimal("1.60"), new BigDecimal("26000"));
    private final User alice = User.builder().id(1L).fullName("Alice").email("a@example.test").build();
    private final User bob = User.builder().id(2L).fullName("Bob").email("b@example.test").build();
    private final AiConversation c1 = AiConversation.builder().id(10L).user(alice).title("đau họng").build();
    private final AiConversation c2 = AiConversation.builder().id(20L).user(bob).title("hoàn tiền").build();

    private AiMessage answer(AiConversation c, long latency, String source, String feedback, boolean handoff,
                             String tools, int prompt, int completion) {
        return AiMessage.builder().conversation(c).role("assistant").content("...").source(source)
                .latencyMs(latency).feedback(feedback).handoffSuggested(handoff).degraded(!source.startsWith("ai-service"))
                .toolCalls(tools).promptTokens(prompt).completionTokens(completion)
                .costUsd(costs.usd(prompt, completion)).createdAt(LocalDateTime.now()).build();
    }

    @Test
    void metricsSummariseQualityCostLatencyAndSafety() {
        AiMessageRepository messages = mock(AiMessageRepository.class);
        SupportMessageRepository supportMessages = mock(SupportMessageRepository.class);
        SupportTicketRepository tickets = mock(SupportTicketRepository.class);
        when(messages.findByCreatedAtAfter(any())).thenReturn(List.of(
                AiMessage.builder().conversation(c1).role("user").content("hi").createdAt(LocalDateTime.now()).build(),
                answer(c1, 1000, "ai-service", "UP", false, "suggest_specialty,find_doctors", 2000, 100),
                answer(c1, 3000, "ai-service-stream", "DOWN", true, "search_clinic_knowledge", 3000, 100),
                answer(c2, 200, "fallback-keyword", null, true, null, 0, 0),
                answer(c2, 9000, "ai-service", "UP", false, "find_doctors", 1000, 50)));
        when(tickets.countByCreatedAtAfter(any())).thenReturn(2L);
        when(supportMessages.countBySenderRoleAndCreatedAtAfter(eq("STAFF"), any())).thenReturn(4L);
        when(supportMessages.countBySenderRoleAndAiAssistedTrueAndCreatedAtAfter(eq("STAFF"), any())).thenReturn(3L);

        Metrics m = new AiInsightsService(messages, mock(AiConversationRepository.class), tickets, supportMessages, costs)
                .metrics(7);

        assertEquals(4, m.turns());                     // user messages are not turns
        assertEquals(2, m.conversations());
        assertEquals(2, m.uniquePatients());
        assertEquals(9000, m.p95LatencyMs());           // nearest rank over [200, 1000, 3000, 9000]
        assertEquals(0.75, m.answeredByAiRate(), 1e-9);  // 3 of 4 answered by the agent (stream included)
        assertEquals(0.5, m.handoffSuggestedRate(), 1e-9);
        assertEquals(2.0 / 3, m.satisfactionRate(), 1e-9);
        assertEquals(2L, m.toolUsage().get("find_doctors"));
        assertEquals(0.75, m.aiDraftUsedRate(), 1e-9);
        assertEquals(6000, m.promptTokens());
        assertEquals(7, m.daily().size());
    }

    @Test
    void percentileHandlesSmallSamples() {
        assertEquals(0, AiInsightsService.percentile(new long[0], 0.95));
        assertEquals(5, AiInsightsService.percentile(new long[]{5}, 0.95));
    }

    @Test
    void costEstimateUsesConfiguredPrices() {
        assertEquals(new BigDecimal("0.000960"), costs.usd(2000, 100)); // 2000 x 0.40 + 100 x 1.60, per million
        assertEquals(25, costs.vnd(new BigDecimal("0.000960")));
    }

    // ---------- conversation store ----------

    private AiConversationStore store(AiConversationRepository conversations, AiMessageRepository messages) {
        return new AiConversationStore(conversations, messages, mock(UserRepository.class), costs);
    }

    @Test
    void cannotContinueSomeoneElsesConversation() {
        AiConversationRepository conversations = mock(AiConversationRepository.class);
        AiMessageRepository messages = mock(AiMessageRepository.class);
        when(conversations.findById(20L)).thenReturn(Optional.of(c2));

        assertThrows(AccessDeniedException.class, () -> store(conversations, messages).appendUserMessage(1L, 20L, "hi"));
        verify(messages, never()).save(any());
    }

    @Test
    void historyForTheModelNeverStartsMidAnswer() {
        AiConversationRepository conversations = mock(AiConversationRepository.class);
        AiMessageRepository messages = mock(AiMessageRepository.class);
        when(conversations.findById(10L)).thenReturn(Optional.of(c1));
        // the 12-message window cut the conversation right after a user turn
        when(messages.findByConversation_IdOrderByIdDesc(anyLong(), any())).thenReturn(List.of(
                AiMessage.builder().role("user").content("tiếp").build(),
                AiMessage.builder().role("assistant").content("Có BS. Khang.").build(),
                AiMessage.builder().role("user").content("Có bác sĩ nào?").build(),
                AiMessage.builder().role("assistant").content("(cut)").build()));

        List<AiChatMessage> history = store(conversations, messages).appendUserMessage(1L, 10L, "tiếp").history();

        assertEquals("user", history.get(0).role());
        assertEquals(List.of("Có bác sĩ nào?", "Có BS. Khang.", "tiếp"), history.stream().map(AiChatMessage::content).toList());
    }

    @Test
    void feedbackOnlyOnYourOwnAssistantAnswers() {
        AiMessageRepository messages = mock(AiMessageRepository.class);
        AiMessage bobsAnswer = AiMessage.builder().id(5L).conversation(c2).role("assistant").content("x").build();
        AiMessage aliceQuestion = AiMessage.builder().id(6L).conversation(c1).role("user").content("x").build();
        when(messages.findById(5L)).thenReturn(Optional.of(bobsAnswer));
        when(messages.findById(6L)).thenReturn(Optional.of(aliceQuestion));
        AiConversationStore store = store(mock(AiConversationRepository.class), messages);

        assertThrows(AccessDeniedException.class, () -> store.feedback(1L, 5L, "DOWN", null));
        assertThrows(IllegalArgumentException.class, () -> store.feedback(1L, 6L, "UP", null));

        store.feedback(2L, 5L, "DOWN", "  sai giờ khám ");
        assertEquals("DOWN", bobsAnswer.getFeedback());
        assertEquals("sai giờ khám", bobsAnswer.getFeedbackComment());
    }

    @Test
    void noConversationToRestoreAfterAWeek() {
        AiConversationRepository conversations = mock(AiConversationRepository.class);
        when(conversations.findFirstByUser_IdAndUpdatedAtAfterOrderByUpdatedAtDesc(anyLong(), any())).thenReturn(Optional.empty());
        assertNull(store(conversations, mock(AiMessageRepository.class)).latest(1L));
        verify(conversations).findFirstByUser_IdAndUpdatedAtAfterOrderByUpdatedAtDesc(eq(1L), any());
    }
}
