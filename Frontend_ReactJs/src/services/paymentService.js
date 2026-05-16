import apiClient from "./apiClient";

export function createPayment(data) {
  return apiClient("POST", "/payments", { body: data });
}

export function getPaymentById(id) {
  return apiClient("GET", `/payments/${id}`);
}

export function getPaymentByAppointmentId(appointmentId) {
  return apiClient("GET", `/payments/appointment/${appointmentId}`);
}

export function updatePaymentStatus(id, status) {
  return apiClient("PATCH", `/payments/${id}/status`, { body: { status } });
}
