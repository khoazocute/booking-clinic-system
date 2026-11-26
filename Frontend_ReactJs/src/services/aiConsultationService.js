import { apiClient, apiStream } from "./apiClient";

export function consultSpecialty(message) {
  return apiClient("/ai/consult", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/**
 * One patient message. The server keeps the conversation (conversationId = null starts a new one) and
 * builds the model's context from its database, so the client never sends assistant turns.
 * The response never books anything: it may contain a `bookingProposal` the patient confirms.
 */
export function chatWithAssistant(conversationId, message) {
  return apiClient("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ conversationId, message }),
  });
}

/**
 * Streaming version. onEvent receives {type: "status", tool}, {type: "delta", text} (whole sentences that
 * passed the safety check), then {type: "done", response} or {type: "error", message}.
 */
export function streamChatWithAssistant(conversationId, message, onEvent) {
  return apiStream("/ai/chat/stream", { conversationId, message }, onEvent);
}

export function getLatestConversation() {
  return apiClient("/ai/conversations/latest");
}

export function sendAnswerFeedback(messageId, rating, comment) {
  return apiClient(`/ai/messages/${messageId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

// ---------- admin: LLMOps ----------

export function getAiMetrics(days = 7) {
  return apiClient(`/ai/admin/metrics?days=${days}`);
}

export function getAiConversations(filter = "ALL", days = 7) {
  return apiClient(`/ai/admin/conversations?filter=${encodeURIComponent(filter)}&days=${days}`);
}

export function getAiConversationTrace(id) {
  return apiClient(`/ai/admin/conversations/${id}`);
}
