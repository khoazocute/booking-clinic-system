import { apiClient } from "./apiClient";

export function getDoctors(params = {}) {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.specialtyId != null) q.set("specialtyId", params.specialtyId);
  const qs = q.toString();
  return apiClient(`/doctors${qs ? `?${qs}` : ""}`);
}

export function getDoctorById(id) {
  return apiClient(`/doctors/${id}`);
}

export function getDoctorReviews(doctorId, params = {}) {
  return apiClient(`/reviews/doctor/${doctorId}`);
}

export function getDoctorSchedules(doctorId, params = {}) {
  const q = new URLSearchParams();
  if (params.workDate) q.set("workDate", params.workDate);
  const qs = q.toString();
  return apiClient(`/doctors/${doctorId}/schedules${qs ? `?${qs}` : ""}`);
}

export function createDoctor(payload) {
  return apiClient("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDoctor(doctorId, payload) {
  return apiClient(`/doctors/${doctorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateDoctorStatus(doctorId, status) {
  return apiClient(`/doctors/${doctorId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
