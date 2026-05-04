import { apiClient } from "./apiClient";

export function getHealth() {
  return apiClient("/health");
}
