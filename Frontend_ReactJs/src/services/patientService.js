import { apiClient } from "./apiClient";

export async function getPatientProfile() {
  return apiClient("/patients/me", { method: "GET" });
}

export async function updatePatientProfile(data) {
  return apiClient("/patients/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
