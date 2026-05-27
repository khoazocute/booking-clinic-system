import doctor1 from "../assets/images/homepage/doctor-1.jpg";
import doctor2 from "../assets/images/homepage/doctor-2.jpg";
import doctor3 from "../assets/images/homepage/doctor-3.jpg";
import doctor4 from "../assets/images/homepage/doctor-4.jpg";

const doctorAvatars = [doctor1, doctor2, doctor3, doctor4];

export function getDoctorAvatar(id) {
  const index = id ? (Number(id) % doctorAvatars.length) : 0;
  return doctorAvatars[index];
}

export function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) {
    return "--";
  }

  return String(value).slice(0, 5);
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function getStatusLabel(status) {
  const labels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    AVAILABLE: "Còn trống",
    BOOKED: "Đã đặt",
    UNAVAILABLE: "Không khả dụng",
    APPOINTMENT_CREATED: "Lịch mới",
    APPOINTMENT_CANCELLED: "Lịch hủy",
    SYSTEM: "Hệ thống",
  };

  return labels[status] ?? status;
}

export function getNotificationReferencePath(notification) {
  if (!notification?.referenceType || !notification?.referenceId) {
    return null;
  }

  const type = String(notification.referenceType).toUpperCase();

  if (type.includes("APPOINTMENT")) {
    return `/doctor/appointments/${notification.referenceId}`;
  }

  if (type.includes("MEDICAL_RECORD")) {
    return `/doctor/medical-records/${notification.referenceId}`;
  }

  if (type.includes("PRESCRIPTION")) {
    return `/doctor/prescriptions/${notification.referenceId}`;
  }

  return null;
}
