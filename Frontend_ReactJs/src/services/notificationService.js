import { apiClient } from "./apiClient";

export function getMyNotifications() {
  return apiClient("/notifications/me");
}

export function getAllNotifications() {
  return apiClient("/notifications/all");
}

export function markAsRead(id) {
  return apiClient(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAsRead() {
  return apiClient("/notifications/read-all", { method: "PATCH" });
}
