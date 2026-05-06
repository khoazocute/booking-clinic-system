import { apiClient } from "./apiClient";

export function getDoctors(params = {}) {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.specialtyId != null) q.set("specialtyId", params.specialtyId);
  if (params.status) q.set("status", params.status);
  if (params.page != null) q.set("page", params.page);
  if (params.size != null) q.set("size", params.size);
  const qs = q.toString();
  return apiClient(`/doctors${qs ? `?${qs}` : ""}`);
}

export function getDoctorById(id) {
  return apiClient(`/doctors/${id}`);
}

export function getDoctorReviews(doctorId, params = {}) {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", params.page);
  if (params.size != null) q.set("size", params.size);
  const qs = q.toString();
  return apiClient(`/doctors/${doctorId}/reviews${qs ? `?${qs}` : ""}`);
}

export function getDoctorSchedules(doctorId, params = {}) {
  const q = new URLSearchParams();
  if (params.fromDate) q.set("from_date", params.fromDate);
  if (params.toDate) q.set("to_date", params.toDate);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiClient(`/doctors/${doctorId}/schedules${qs ? `?${qs}` : ""}`);
}
