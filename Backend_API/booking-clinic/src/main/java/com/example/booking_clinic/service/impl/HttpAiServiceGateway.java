package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.ai.AiServiceChatResult;
import com.example.booking_clinic.dto.ai.AiTriageResult;
import com.example.booking_clinic.dto.support.SupportAssistResult;
import com.example.booking_clinic.service.AiServiceGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Stream;

/**
 * HTTP client for the internal Python AI_Service. Authenticated with a shared secret header; the
 * patient's JWT is never forwarded (the AI service only reads public data and never writes).
 */
@Slf4j
@Component
public class HttpAiServiceGateway implements AiServiceGateway {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final boolean enabled;
    private final String baseUrl;
    private final String internalToken;
    private final Duration chatTimeout;
    private final HttpClient http;
    private final RestClient fastClient;   // triage, index rebuild
    private final RestClient chatClient;   // LLM + tool calls take longer

    public HttpAiServiceGateway(
            @Value("${AI_SERVICE_BASE_URL:http://localhost:8000}") String baseUrl,
            @Value("${AI_INTERNAL_TOKEN:}") String internalToken,
            @Value("${AI_SERVICE_ENABLED:true}") boolean enabled,
            @Value("${AI_SERVICE_CHAT_TIMEOUT_SECONDS:30}") long chatTimeoutSeconds) {
        this.enabled = enabled && !internalToken.isBlank();
        if (enabled && internalToken.isBlank()) {
            log.warn("AI_INTERNAL_TOKEN is not set: AI_Service disabled, using the local keyword router");
        }
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.internalToken = internalToken;
        this.chatTimeout = Duration.ofSeconds(chatTimeoutSeconds);
        // HTTP/1.1 explicitly: the JDK client otherwise attempts an h2c upgrade on plain HTTP, which
        // uvicorn rejects ("Unsupported upgrade request") and the POST body is lost (422 from FastAPI).
        this.http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(2))
                .build();
        this.fastClient = client(Duration.ofSeconds(5));
        this.chatClient = client(chatTimeout);
    }

    private RestClient client(Duration readTimeout) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(readTimeout);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("X-Internal-Token", internalToken)
                .build();
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public AiTriageResult triage(String message) {
        return call("triage", () -> fastClient.post().uri("/v1/triage")
                .body(Map.of("message", message))
                .retrieve()
                .body(AiTriageResult.class));
    }

    @Override
    public AiServiceChatResult chat(List<AiChatMessage> messages) {
        AiServiceChatResult result = call("chat", () -> chatClient.post().uri("/v1/chat")
                .body(Map.of("messages", messages))
                .retrieve()
                .body(AiServiceChatResult.class));
        log.info("AI chat: model={}, tokens={}+{}, tools={}", result.model(), result.promptTokens(),
                result.completionTokens(), result.toolCalls());
        return result;
    }

    /**
     * Reads AI_Service's server-sent events line by line and forwards progress as it arrives, so the
     * patient sees tool status and checked sentences while the model is still working.
     */
    @Override
    public AiServiceChatResult chatStream(List<AiChatMessage> messages, Consumer<Map<String, Object>> progress) {
        if (!enabled) {
            throw new AiServiceUnavailableException("AI_Service is disabled", null);
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/v1/chat/stream"))
                .timeout(chatTimeout)
                .header("Content-Type", "application/json")
                .header("Accept", "text/event-stream")
                .header("X-Internal-Token", internalToken)
                .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(Map.of("messages", messages))))
                .build();
        HttpResponse<Stream<String>> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofLines());
        } catch (IOException e) {
            throw new AiServiceUnavailableException("AI_Service chat stream failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiServiceUnavailableException("AI_Service chat stream interrupted", e);
        }
        if (response.statusCode() != 200) {
            response.body().close();
            throw new AiServiceUnavailableException("AI_Service chat stream returned HTTP " + response.statusCode(), null);
        }

        try (Stream<String> lines = response.body()) {
            Iterator<String> it = lines.iterator();
            while (it.hasNext()) {
                String line = it.next();
                if (!line.startsWith("data: ")) {
                    continue;
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> event = JSON.readValue(line.substring(6), Map.class);
                String type = String.valueOf(event.get("type"));
                switch (type) {
                    case "done" -> {
                        AiServiceChatResult result = JSON.convertValue(event.get("result"), AiServiceChatResult.class);
                        log.info("AI chat (stream): model={}, tokens={}+{}, tools={}", result.model(),
                                result.promptTokens(), result.completionTokens(), result.toolCalls());
                        return result;
                    }
                    case "error" -> throw new AiServiceUnavailableException("AI_Service: " + event.get("message"), null);
                    default -> progress.accept(event);
                }
            }
        } catch (AiServiceUnavailableException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new AiServiceUnavailableException("AI_Service chat stream broke: " + e.getMessage(), e);
        }
        throw new AiServiceUnavailableException("AI_Service chat stream ended without a result", null);
    }

    @Override
    public SupportAssistResult assist(Map<String, Object> request) {
        SupportAssistResult result = call("assist", () -> chatClient.post().uri("/v1/support/assist")
                .body(request)
                .retrieve()
                .body(SupportAssistResult.class));
        log.info("AI assist: model={}, tokens={}+{}", result.model(), result.promptTokens(), result.completionTokens());
        return result;
    }

    @Override
    public void rebuildIndex() {
        call("index rebuild", () -> fastClient.post().uri("/v1/index/rebuild").retrieve().toBodilessEntity());
    }

    private <T> T call(String operation, Supplier<T> request) {
        if (!enabled) {
            throw new AiServiceUnavailableException("AI_Service is disabled", null);
        }
        try {
            T body = request.get();
            if (body == null) {
                throw new AiServiceUnavailableException("AI_Service returned an empty " + operation + " response", null);
            }
            return body;
        } catch (RestClientException e) {
            throw new AiServiceUnavailableException("AI_Service " + operation + " failed: " + e.getMessage(), e);
        }
    }
}
