import { apiClient } from "./apiClient";

export function getSpecialties(params = {}) {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  const qs = q.toString();
  return apiClient(`/specialties${qs ? `?${qs}` : ""}`);
}

export function getSpecialtyById(id) {
  return apiClient(`/specialties/${id}`);
}
