import { apiClient } from "./apiClient";

/**
 * Human handoff. A patient opens a ticket (optionally sharing the AI chat), clinic staff (admins) reply.
 * New messages are also pushed over STOMP to /user/queue/support (see hooks/useSupportSocket.js).
 */
export function createSupportTicket({ message, reason, transcript }) {
  return apiClient("/support/tickets", {
    method: "POST",
    body: JSON.stringify({ message, reason, transcript }),
  });
}

export function getMyActiveSupportTicket() {
  return apiClient("/support/tickets/me/active");
}

export function getSupportTicket(id) {
  return apiClient(`/support/tickets/${id}`);
}

/** aiAssisted (staff only): the reply started from the AI draft, measured on the AI dashboard. */
export function sendSupportMessage(id, content, aiAssisted = false) {
  return apiClient(`/support/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, aiAssisted }),
  });
}

/** Staff: AI summary + draft reply grounded in clinic rules. Shown for editing, never sent automatically. */
export function getSupportAssist(id) {
  return apiClient(`/support/tickets/${id}/assist`, { method: "POST" });
}

export function closeSupportTicket(id) {
  return apiClient(`/support/tickets/${id}/close`, { method: "PATCH" });
}

/** Staff inbox. status: OPEN (default) | WAITING_STAFF | ANSWERED | CLOSED | ALL */
export function listSupportTickets(status = "OPEN") {
  return apiClient(`/support/tickets?status=${encodeURIComponent(status)}`);
}
