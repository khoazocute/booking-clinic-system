import { apiClient } from "./apiClient";

export function getUsers() {
  return apiClient("/users");
}
