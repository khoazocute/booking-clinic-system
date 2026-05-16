import { apiClient } from "./apiClient";

export function getAllPayments() {
  return apiClient("/payments");
}

export function createPayment(data) {
  return apiClient("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPaymentById(id) {
  return apiClient(`/payments/${id}`);
}

export function getPaymentByAppointmentId(appointmentId) {
  return apiClient(`/payments/appointment/${appointmentId}`);
}

export function updatePaymentStatus(id, status) {
  return apiClient(`/payments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
