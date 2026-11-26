package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.common.exception.TooManyRequestsException;
import com.example.booking_clinic.dto.ai.AiChatRequest;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiConversationViews.PatientConversation;
import com.example.booking_clinic.dto.ai.AiServiceChatResult;
import com.example.booking_clinic.entity.AiMessage;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.service.AiChatService;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiRateLimiter;
import com.example.booking_clinic.service.AiServiceGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    static final String DEGRADED_NOTE =
            "\n\n(Trợ lý AI đang tạm gián đoạn, đây là gợi ý chuyên khoa cơ bản. Bạn vẫn có thể đặt lịch trên trang Bác sĩ.)";

    static final String DAILY_LIMIT_MESSAGE =
            "Bạn đã dùng hết lượt trò chuyện với trợ lý AI hôm nay. Bạn vẫn có thể đặt lịch trên trang Bác sĩ "
                    + "hoặc bấm \"Gặp tư vấn viên\" để được nhân viên hỗ trợ.";

    private final AiServiceGateway aiServiceGateway;
    private final AiConsultationService aiConsultationService;
    private final AiRateLimiter aiRateLimiter;
    private final AiConversationStore store;

    @Override
    public PreparedTurn prepare(AiChatRequest request) {
        User user = currentUser();
        String key = "user:" + user.getId();
        aiRateLimiter.check(key);

        boolean useAi = aiServiceGateway.isEnabled();
        if (useAi) {
            AiRateLimiter.Quota quota = aiRateLimiter.consumeDailyQuota(key);
            if (quota == AiRateLimiter.Quota.USER_EXCEEDED) {
                throw new TooManyRequestsException(DAILY_LIMIT_MESSAGE);
            }
            if (quota == AiRateLimiter.Quota.GLOBAL_EXCEEDED) {
                // system-wide budget spent: keep answering for free with the keyword router
                log.warn("Global daily AI quota reached, answering in degraded mode");
                useAi = false;
            }
        }

        AiConversationStore.Opened opened = store.appendUserMessage(user.getId(), request.conversationId(), request.message());
        return new PreparedTurn(user.getId(), opened.conversationId(), opened.history(), request.message().trim(), useAi);
    }

    @Override
    public AiChatResponse complete(PreparedTurn turn, Consumer<Map<String, Object>> progress) {
        long start = System.nanoTime();
        AiChatResponse response;
        AiConversationStore.Telemetry telemetry;

        AiServiceChatResult result = null;
        if (turn.useAi()) {
            try {
                result = progress == null
                        ? aiServiceGateway.chat(turn.history())
                        : aiServiceGateway.chatStream(turn.history(), progress);
            } catch (AiServiceUnavailableException e) {
                log.warn("AI chat unavailable, degrading to triage: {}", e.getMessage());
            }
        }

        if (result != null) {
            String source = progress == null ? "ai-service" : "ai-service-stream";
            response = result.toResponse().withSource(source);
            telemetry = new AiConversationStore.Telemetry(source, result.model(), result.toolCalls(),
                    result.promptTokens(), result.completionTokens(), elapsedMs(start),
                    Boolean.TRUE.equals(result.outputBlocked()));
        } else {
            response = degraded(turn.message());
            telemetry = new AiConversationStore.Telemetry(response.source(), null, List.of(), null, null,
                    elapsedMs(start), false);
        }

        AiMessage saved = store.saveAssistant(turn.conversationId(), response, telemetry);
        return response.withIds(turn.conversationId(), saved.getId());
    }

    @Override
    public PatientConversation latestConversation() {
        return store.latest(currentUser().getId());
    }

    @Override
    public void feedback(Long messageId, String rating, String comment) {
        store.feedback(currentUser().getId(), messageId, rating, comment);
    }

    /** Triage still runs the red-flag rules (in AI_Service when reachable) and suggests a specialty. */
    private AiChatResponse degraded(String message) {
        AiConsultResponse consult = aiConsultationService.consult(new AiConsultRequest(message));
        String answer = consult.emergency() != null ? consult.answer() : consult.answer() + DEGRADED_NOTE;
        // no handoff button over an emergency: calling 115 is the only action that matters
        boolean handoff = consult.emergency() == null;
        return new AiChatResponse(answer, consult.emergency(), List.of(), List.of(), List.of(), null,
                consult.suggestions(), true, consult.source(), handoff, handoff ? "AI_UNAVAILABLE" : null,
                null, null);
    }

    private static long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }

    /**
     * The JWT filter puts the {@link User} entity in the principal. {@code authentication.getName()} must
     * not be used as a key: the entity's toString() differs per request.
     */
    User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user && user.getId() != null) {
            return user;
        }
        throw new AccessDeniedException("Authentication required");
    }

    /** Stable per-patient key for rate limits. */
    String currentUserKey() {
        return "user:" + currentUser().getId();
    }
}
