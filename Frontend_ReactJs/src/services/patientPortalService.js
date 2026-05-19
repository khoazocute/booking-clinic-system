import { apiClient } from "./apiClient";
import {
  cancelAppointment,
  getAppointmentById,
  getMyAppointments,
} from "./appointmentService";

export { cancelAppointment, getAppointmentById, getMyAppointments };

export async function getMedicalRecordByAppointmentId(appointmentId) {
  const response = await apiClient(`/medical-records/appointment/${appointmentId}`);
  return response?.data;
}

export async function getMedicalRecordById(medicalRecordId) {
  const response = await apiClient(`/medical-records/${medicalRecordId}`);
  return response?.data;
}

export async function getPrescriptionByMedicalRecordId(medicalRecordId) {
  const response = await apiClient(`/prescriptions/medical-record/${medicalRecordId}`);
  return response?.data;
}

export async function getPrescriptionById(prescriptionId) {
  const response = await apiClient(`/prescriptions/${prescriptionId}`);
  return response?.data;
}

export async function createReview(payload) {
  const response = await apiClient("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response?.data;
}

export async function getReviewById(reviewId) {
  const response = await apiClient(`/reviews/${reviewId}`);
  return response?.data;
}

export async function getReviewsByDoctor(doctorId) {
  const response = await apiClient(`/reviews/doctor/${doctorId}`);
  return response?.data ?? [];
}

export async function updateReview(reviewId, payload) {
  const response = await apiClient(`/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response?.data;
}

export async function getMyNotifications() {
  const response = await apiClient("/notifications/me");
  return response?.data ?? [];
}

export async function markNotificationAsRead(notificationId) {
  const response = await apiClient(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  return response?.data;
}

export async function markAllNotificationsAsRead() {
  await apiClient("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function getMyPrescriptionSummaries() {
  const appointmentsResponse = await getMyAppointments();
  const appointments = appointmentsResponse?.data ?? [];
  const completedAppointments = appointments.filter((item) => item.status === "COMPLETED");

  const settled = await Promise.allSettled(
    completedAppointments.map(async (appointment) => {
      const medicalRecord = await getMedicalRecordByAppointmentId(appointment.id);
      const prescription = await getPrescriptionByMedicalRecordId(medicalRecord.id);
      return {
        appointment,
        medicalRecord,
        prescription,
      };
    }),
  );

  return settled
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value)
    .filter((item) => item.prescription);
}
