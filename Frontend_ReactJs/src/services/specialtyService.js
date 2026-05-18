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

export function createSpecialty(payload) {
  return apiClient("/specialties", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSpecialty(id, payload) {
  return apiClient(`/specialties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSpecialty(id) {
  return apiClient(`/specialties/${id}`, {
    method: "DELETE",
  });
}
