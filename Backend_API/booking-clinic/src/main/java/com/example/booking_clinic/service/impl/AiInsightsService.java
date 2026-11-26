package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConversationViews.ConversationSummary;
import com.example.booking_clinic.dto.ai.AiConversationViews.ConversationTrace;
import com.example.booking_clinic.dto.ai.AiConversationViews.DailyPoint;
import com.example.booking_clinic.dto.ai.AiConversationViews.MessageTrace;
import com.example.booking_clinic.dto.ai.AiConversationViews.Metrics;
import com.example.booking_clinic.entity.AiConversation;
import com.example.booking_clinic.entity.AiMessage;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.AiConversationRepository;
import com.example.booking_clinic.repository.AiMessageRepository;
import com.example.booking_clinic.repository.SupportMessageRepository;
import com.example.booking_clinic.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * LLMOps for the assistant: quality, cost, latency and safety signals computed from the stored turns.
 * Aggregation happens in memory over the selected window, which is fine at clinic scale (thousands of
 * turns); a larger deployment would pre-aggregate per day.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiInsightsService {

    static final int MAX_DAYS = 90;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final AiMessageRepository messages;
    private final AiConversationRepository conversations;
    private final SupportTicketRepository supportTickets;
    private final SupportMessageRepository supportMessages;
    private final AiCostEstimator costs;

    @Transactional(readOnly = true)
    public Metrics metrics(int days) {
        int window = Math.max(1, Math.min(days, MAX_DAYS));
        LocalDateTime since = LocalDate.now().minusDays(window - 1L).atStartOfDay();
        List<AiMessage> all = messages.findByCreatedAtAfter(since);
        List<AiMessage> turns = all.stream().filter(m -> "assistant".equals(m.getRole())).toList();
        long n = turns.size();

        long[] latencies = turns.stream().map(AiMessage::getLatencyMs).filter(Objects::nonNull)
                .mapToLong(Long::longValue).sorted().toArray();
        long prompt = turns.stream().map(AiMessage::getPromptTokens).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
        long completion = turns.stream().map(AiMessage::getCompletionTokens).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
        BigDecimal cost = turns.stream().map(AiMessage::getCostUsd).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        long up = count(turns, m -> "UP".equals(m.getFeedback()));
        long down = count(turns, m -> "DOWN".equals(m.getFeedback()));

        Map<String, Long> tools = turns.stream()
                .filter(m -> m.getToolCalls() != null)
                .flatMap(m -> Arrays.stream(m.getToolCalls().split(",")))
                .collect(Collectors.groupingBy(t -> t, TreeMap::new, Collectors.counting()));

        Map<LocalDate, List<AiMessage>> byDay = new TreeMap<>();
        for (int i = 0; i < window; i++) {
            byDay.put(since.toLocalDate().plusDays(i), new ArrayList<>());
        }
        turns.forEach(m -> byDay.computeIfAbsent(m.getCreatedAt().toLocalDate(), d -> new ArrayList<>()).add(m));
        List<DailyPoint> daily = byDay.entrySet().stream().map(e -> new DailyPoint(e.getKey(), e.getValue().size(),
                        e.getValue().stream().map(AiMessage::getCostUsd).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add),
                        Math.round(e.getValue().stream().map(AiMessage::getLatencyMs).filter(Objects::nonNull).mapToLong(Long::longValue).average().orElse(0)),
                        count(e.getValue(), m -> "DOWN".equals(m.getFeedback())),
                        count(e.getValue(), m -> Boolean.TRUE.equals(m.getHandoffSuggested()))))
                .toList();

        long staffReplies = supportMessages.countBySenderRoleAndCreatedAtAfter("STAFF", since);
        long aiDrafted = supportMessages.countBySenderRoleAndAiAssistedTrueAndCreatedAtAfter("STAFF", since);

        return new Metrics(window, n,
                turns.stream().map(m -> m.getConversation().getId()).distinct().count(),
                turns.stream().map(m -> m.getConversation().getUser().getId()).distinct().count(),
                latencies.length == 0 ? 0 : Math.round(Arrays.stream(latencies).average().orElse(0)),
                percentile(latencies, 0.95),
                prompt, completion, cost, costs.vnd(cost), n == 0 ? 0 : costs.vnd(cost) / n,
                rate(count(turns, m -> m.getSource() != null && m.getSource().startsWith("ai-service")), n),
                rate(count(turns, m -> Boolean.TRUE.equals(m.getDegraded())), n),
                rate(count(turns, m -> Boolean.TRUE.equals(m.getHandoffSuggested())), n),
                count(turns, m -> m.getEmergencyCategory() != null),
                count(turns, m -> Boolean.TRUE.equals(m.getOutputBlocked())),
                up, down, up + down == 0 ? null : (double) up / (up + down),
                supportTickets.countByCreatedAtAfter(since), staffReplies,
                staffReplies == 0 ? null : (double) aiDrafted / staffReplies,
                tools, daily, costs.note());
    }

    /** @param filter ALL, DOWNVOTED, HANDOFF, EMERGENCY, DEGRADED or BLOCKED */
    @Transactional(readOnly = true)
    public List<ConversationSummary> conversations(String filter, int days) {
        int window = Math.max(1, Math.min(days, MAX_DAYS));
        LocalDateTime since = LocalDate.now().minusDays(window - 1L).atStartOfDay();
        Map<Long, List<AiMessage>> byConversation = messages.findByCreatedAtAfter(since).stream()
                .collect(Collectors.groupingBy(m -> m.getConversation().getId(), LinkedHashMap::new, Collectors.toList()));

        String f = filter == null ? "ALL" : filter.trim().toUpperCase();
        return byConversation.values().stream()
                .map(this::summarize)
                .filter(s -> switch (f) {
                    case "DOWNVOTED" -> s.downvotes() > 0;
                    case "HANDOFF" -> s.handoff();
                    case "EMERGENCY" -> s.emergency();
                    case "DEGRADED" -> s.degraded();
                    case "BLOCKED" -> s.outputBlocked();
                    default -> true;
                })
                .sorted(Comparator.comparing(ConversationSummary::lastAt).reversed())
                .limit(200)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationTrace conversation(Long id) {
        AiConversation conversation = conversations.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + id));
        User user = conversation.getUser();
        List<MessageTrace> trace = messages.findByConversation_IdOrderByIdAsc(id).stream().map(this::trace).toList();
        return new ConversationTrace(id, displayName(user), user.getEmail(), conversation.getCreatedAt(), trace);
    }

    private ConversationSummary summarize(List<AiMessage> list) {
        AiConversation c = list.get(0).getConversation();
        List<AiMessage> answers = list.stream().filter(m -> "assistant".equals(m.getRole())).toList();
        BigDecimal cost = answers.stream().map(AiMessage::getCostUsd).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ConversationSummary(c.getId(), displayName(c.getUser()), c.getTitle(), answers.size(),
                list.stream().map(AiMessage::getCreatedAt).min(Comparator.naturalOrder()).orElse(null),
                list.stream().map(AiMessage::getCreatedAt).max(Comparator.naturalOrder()).orElse(null),
                cost, costs.vnd(cost),
                Math.round(answers.stream().map(AiMessage::getLatencyMs).filter(Objects::nonNull).mapToLong(Long::longValue).average().orElse(0)),
                count(answers, m -> "UP".equals(m.getFeedback())),
                count(answers, m -> "DOWN".equals(m.getFeedback())),
                answers.stream().anyMatch(m -> Boolean.TRUE.equals(m.getHandoffSuggested())),
                answers.stream().anyMatch(m -> m.getEmergencyCategory() != null),
                answers.stream().anyMatch(m -> Boolean.TRUE.equals(m.getDegraded())),
                answers.stream().anyMatch(m -> Boolean.TRUE.equals(m.getOutputBlocked())));
    }

    private MessageTrace trace(AiMessage m) {
        List<String> citations = List.of();
        if (m.getArtifactsJson() != null) {
            try {
                AiChatResponse r = JSON.readValue(m.getArtifactsJson(), AiChatResponse.class);
                if (r.citations() != null) {
                    citations = r.citations().stream().map(c -> "[" + c.ref() + "] " + c.title()).toList();
                }
            } catch (RuntimeException e) {
                log.debug("unreadable artifacts on message {}", m.getId());
            }
        }
        return new MessageTrace(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt(), m.getSource(), m.getModel(),
                m.getToolCalls() == null ? List.of() : List.of(m.getToolCalls().split(",")),
                m.getPromptTokens(), m.getCompletionTokens(), m.getCostUsd(), m.getLatencyMs(), m.getEmergencyCategory(),
                Boolean.TRUE.equals(m.getHandoffSuggested()), Boolean.TRUE.equals(m.getDegraded()),
                Boolean.TRUE.equals(m.getOutputBlocked()), citations, m.getFeedback(), m.getFeedbackComment());
    }

    static long percentile(long[] sorted, double p) {
        if (sorted.length == 0) {
            return 0;
        }
        int index = (int) Math.ceil(p * sorted.length) - 1; // nearest-rank
        return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    }

    private static long count(List<AiMessage> list, Predicate<AiMessage> predicate) {
        return list.stream().filter(predicate).count();
    }

    private static double rate(long part, long total) {
        return total == 0 ? 0 : (double) part / total;
    }

    private static String displayName(User user) {
        return user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail();
    }
}
