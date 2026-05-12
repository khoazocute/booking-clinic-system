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
    PENDING: "Cho xac nhan",
    CONFIRMED: "Da xac nhan",
    COMPLETED: "Hoan tat",
    CANCELLED: "Da huy",
    AVAILABLE: "Con trong",
    BOOKED: "Da dat",
    UNAVAILABLE: "Khong kha dung",
    APPOINTMENT_CREATED: "Lich moi",
    APPOINTMENT_CANCELLED: "Lich huy",
    SYSTEM: "He thong",
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
