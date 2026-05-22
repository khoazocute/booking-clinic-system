import { apiClient } from "./apiClient";

export function consultSpecialty(message) {
  return apiClient("/ai/consult", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
