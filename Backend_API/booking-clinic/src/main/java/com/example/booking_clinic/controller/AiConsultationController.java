package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.ai.AiChatRequest;
import com.example.booking_clinic.dto.ai.AiChatResponse;
import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.dto.ai.AiConversationViews.ConversationSummary;
import com.example.booking_clinic.dto.ai.AiConversationViews.ConversationTrace;
import com.example.booking_clinic.dto.ai.AiConversationViews.FeedbackRequest;
import com.example.booking_clinic.dto.ai.AiConversationViews.Metrics;
import com.example.booking_clinic.dto.ai.AiConversationViews.PatientConversation;
import com.example.booking_clinic.event.AiKnowledgeChangedEvent;
import com.example.booking_clinic.service.AiChatService;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiKnowledgeService;
import com.example.booking_clinic.service.impl.AiInsightsService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiConsultationController {

    /** Streams wait on the network, not the CPU: one virtual thread per stream. */
    private static final ExecutorService STREAMS = Executors.newVirtualThreadPerTaskExecutor();
    private static final long STREAM_TIMEOUT_MS = 90_000;

    private final AiKnowledgeService aiKnowledgeService;
    private final AiConsultationService aiConsultationService;
    private final AiChatService aiChatService;
    private final AiInsightsService aiInsightsService;
    private final ApplicationEventPublisher eventPublisher;

    /** ADMIN: rebuild the local keyword index now and trigger an AI_Service re-index (async). */
    @PostMapping("/rebuild-index")
    public ResponseEntity<ApiResponse<Integer>> rebuildIndex() {
        int count = aiKnowledgeService.rebuildIndex();
        eventPublisher.publishEvent(new AiKnowledgeChangedEvent("manual rebuild"));
        return ResponseEntity.ok(ApiResponse.success("AI index rebuilt successfully", count));
    }

    /** PATIENT: one-shot specialty triage (emergency check + suggestions). */
    @PostMapping("/consult")
    public ResponseEntity<ApiResponse<AiConsultResponse>> consult(@Valid @RequestBody AiConsultRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("AI consultation completed", aiConsultationService.consult(request)));
    }

    /** PATIENT: multi-turn RAG + tool-calling assistant. Never books: it returns a proposal to confirm. */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        return ResponseEntity.ok(ApiResponse.success("AI chat completed", aiChatService.chat(request)));
    }

    /**
     * PATIENT: the same turn as server-sent events. Validation, rate limits and quota run first, in this
     * thread, so they still fail as ordinary HTTP errors (401/403/429) before any event is sent.
     * Events: {"type":"status","tool"}, {"type":"delta","text"}, then {"type":"done","response"} or {"type":"error"}.
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@Valid @RequestBody AiChatRequest request, HttpServletResponse response) {
        AiChatService.PreparedTurn turn = aiChatService.prepare(request);
        response.setHeader("X-Accel-Buffering", "no"); // nginx: do not buffer the stream
        response.setHeader("Cache-Control", "no-cache");

        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        STREAMS.execute(() -> {
            try {
                AiChatResponse result = aiChatService.complete(turn, event -> send(emitter, event));
                send(emitter, Map.of("type", "done", "response", result));
                emitter.complete();
            } catch (Exception e) {
                log.warn("AI chat stream failed: {}", e.getMessage());
                send(emitter, Map.of("type", "error", "message", "Không thể kết nối trợ lý AI lúc này."));
                emitter.complete();
            }
        });
        return emitter;
    }

    private static void send(SseEmitter emitter, Object event) {
        try {
            emitter.send(SseEmitter.event().data(event, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException e) {
            // the patient closed the widget: keep going so the answer and telemetry are still saved
            log.debug("SSE client gone: {}", e.getMessage());
        }
    }

    /** PATIENT: restore the latest conversation (within a week) after a reload. */
    @GetMapping("/conversations/latest")
    public ResponseEntity<ApiResponse<PatientConversation>> latestConversation() {
        return ResponseEntity.ok(ApiResponse.success("Latest conversation", aiChatService.latestConversation()));
    }

    /** PATIENT: thumbs up / down on one assistant answer. */
    @PostMapping("/messages/{id}/feedback")
    public ResponseEntity<ApiResponse<Void>> feedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request) {
        aiChatService.feedback(id, request.rating(), request.comment());
        return ResponseEntity.ok(ApiResponse.success("Feedback saved", null));
    }

    // ---------- ADMIN: LLMOps ----------

    @GetMapping("/admin/metrics")
    public ResponseEntity<ApiResponse<Metrics>> metrics(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success("AI metrics", aiInsightsService.metrics(days)));
    }

    @GetMapping("/admin/conversations")
    public ResponseEntity<ApiResponse<List<ConversationSummary>>> conversations(
            @RequestParam(defaultValue = "ALL") String filter, @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success("AI conversations", aiInsightsService.conversations(filter, days)));
    }

    @GetMapping("/admin/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationTrace>> conversation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("AI conversation", aiInsightsService.conversation(id)));
    }
}
