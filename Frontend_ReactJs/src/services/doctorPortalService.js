import { getCurrentUser } from "./authService";
import { apiClient } from "./apiClient";

async function getAllDoctors() {
  const response = await apiClient("/doctors");
  return response?.data ?? [];
}

export async function getCurrentDoctorProfile() {
  const currentUserResponse = await getCurrentUser();
  const currentUser = currentUserResponse?.data;

  if (!currentUser?.id) {
    throw new Error("Unable to resolve current user.");
  }

  const doctors = await getAllDoctors();
  const doctor =
    doctors.find((item) => item.userId === currentUser.id) ??
    doctors.find((item) => item.email === currentUser.email);

  if (!doctor) {
    throw new Error("Doctor profile not found for the current account.");
  }

  return doctor;
}

export async function updateCurrentDoctorProfile(payload) {
  const response = await apiClient("/doctors/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return response?.data;
}

export async function getDoctorAppointments() {
  const doctor = await getCurrentDoctorProfile();
  const response = await apiClient(`/appointments/doctor/${doctor.id}`);
  return {
    doctor,
    appointments: response?.data ?? [],
  };
}

export async function getAppointmentById(appointmentId) {
  const response = await apiClient(`/appointments/${appointmentId}`);
  return response?.data;
}

export async function updateAppointmentStatus(appointmentId, payload) {
  const response = await apiClient(`/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response?.data;
}

export async function getMedicalRecordByAppointmentId(appointmentId) {
  const response = await apiClient(`/medical-records/appointment/${appointmentId}`);
  return response?.data;
}

export async function getMedicalRecordById(medicalRecordId) {
  const response = await apiClient(`/medical-records/${medicalRecordId}`);
  return response?.data;
}

export async function createMedicalRecord(payload) {
  const response = await apiClient("/medical-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export async function createPrescription(payload) {
  const response = await apiClient("/prescriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response?.data;
}

export async function getDoctorReviews() {
  const doctor = await getCurrentDoctorProfile();
  const response = await apiClient(`/reviews/doctor/${doctor.id}`);
  return {
    doctor,
    reviews: response?.data ?? [],
  };
}

export async function getDoctorNotifications() {
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

export async function getMedicines() {
  const response = await apiClient("/medicines");
  return response?.data ?? [];
}

export async function getSpecialties() {
  const response = await apiClient("/specialties");
  return response?.data ?? [];
}

export async function getDoctorSchedules(workDate) {
  const doctor = await getCurrentDoctorProfile();
  const query = workDate
    ? `/doctor-schedules?doctorId=${doctor.id}&workDate=${encodeURIComponent(workDate)}`
    : `/doctor-schedules?doctorId=${doctor.id}`;
  const response = await apiClient(query);

  return {
    doctor,
    schedules: response?.data ?? [],
  };
}

export async function getDoctorScheduleById(scheduleId) {
  const result = await getDoctorSchedules();
  const schedule = result.schedules.find((item) => String(item.id) === String(scheduleId));

  if (!schedule) {
    throw new Error("Doctor schedule not found.");
  }

  return schedule;
}

export async function createDoctorSchedule(payload) {
  const doctor = await getCurrentDoctorProfile();
  const response = await apiClient("/doctor-schedules", {
    method: "POST",
    body: JSON.stringify({
      doctorId: doctor.id,
      ...payload,
    }),
  });

  return response?.data;
}

export async function updateDoctorSchedule(scheduleId, payload) {
  const doctor = await getCurrentDoctorProfile();
  const response = await apiClient(`/doctor-schedules/${scheduleId}`, {
    method: "PUT",
    body: JSON.stringify({
      doctorId: doctor.id,
      ...payload,
    }),
  });

  return response?.data;
}

export async function deleteDoctorSchedule(scheduleId) {
  await apiClient(`/doctor-schedules/${scheduleId}`, {
    method: "DELETE",
  });
}

export async function updateDoctorScheduleStatus(scheduleId, status) {
  const response = await apiClient(`/doctor-schedules/${scheduleId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return response?.data;
}
