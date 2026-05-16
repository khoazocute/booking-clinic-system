export const STATUS_LABELS = {
  PENDING: "Cho xac nhan",
  CONFIRMED: "Da xac nhan",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
  PAID: "Da thanh toan",
  FAILED: "That bai",
  PRESCRIPTION_CREATED: "Don thuoc",
  APPOINTMENT_CREATED: "Lich hen",
  APPOINTMENT_CONFIRMED: "Xac nhan",
  APPOINTMENT_CANCELLED: "Da huy",
  PAYMENT_CREATED: "Thanh toan",
  PAYMENT_COMPLETED: "Da thanh toan",
};

export function formatDate(value) {
  if (!value) return "--";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(value) {
  if (!value) return "--";
  return String(value).slice(0, 5);
}

export function formatCurrency(value) {
  if (value == null) return "--";
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "--";
}

export function getStatusTone(status) {
  if (["COMPLETED", "PAID", "PAYMENT_COMPLETED"].includes(status)) return "success";
  if (["CONFIRMED", "PRESCRIPTION_CREATED", "APPOINTMENT_CONFIRMED"].includes(status)) return "primary";
  if (["PENDING", "APPOINTMENT_CREATED", "PAYMENT_CREATED"].includes(status)) return "warning";
  if (["CANCELLED", "FAILED", "APPOINTMENT_CANCELLED"].includes(status)) return "danger";
  return "neutral";
}

export function PatientStatusBadge({ status }) {
  return (
    <span className={`patient-badge patient-badge--${getStatusTone(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function PatientPageShell({ eyebrow, title, description, actions, children }) {
  return (
    <div className="browse-page patient-portal-page">
      <div className="mc-container patient-portal-wrap">
        <header className="patient-portal-header">
          <div>
            {eyebrow ? <span className="patient-portal-eyebrow">{eyebrow}</span> : null}
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="patient-portal-actions">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="patient-empty">
      <span className="material-symbols-outlined">{icon}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
