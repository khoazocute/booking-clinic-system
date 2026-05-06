import { apiClient } from "./apiClient";

export function getMyProfile() {
  return apiClient("/patients/me");
}

export function updateMyProfile(payload) {
  return apiClient("/patients/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
