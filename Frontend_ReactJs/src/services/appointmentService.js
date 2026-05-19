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
  return apiClient(`/appointments/me${qs ? `?${qs}` : ""}`);
}

export function getAppointmentById(id) {
  return apiClient(`/appointments/${id}`);
}

export function cancelAppointment(id, cancelReason = "") {
  return apiClient(`/appointments/${id}`, {
    method: "DELETE",
  });
}

export function getAllAppointments() {
  return apiClient("/appointments");
}

export function updateAppointmentStatus(id, status, cancelReason = "") {
  return apiClient(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, cancelReason }),
  });
}
