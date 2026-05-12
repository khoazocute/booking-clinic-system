import { apiClient } from "./apiClient";

export function createAppointment(payload) {
  return apiClient("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyAppointments(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.page != null) q.set("page", params.page);
  if (params.size != null) q.set("size", params.size);
  const qs = q.toString();
  return apiClient(`/appointments/my${qs ? `?${qs}` : ""}`);
}

export function getAppointmentById(id) {
  return apiClient(`/appointments/${id}`);
}

export function cancelAppointment(id, cancelReason = "") {
  return apiClient(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ cancelReason }),
  });
}
