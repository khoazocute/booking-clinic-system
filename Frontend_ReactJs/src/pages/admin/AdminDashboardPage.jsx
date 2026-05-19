import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import { apiClient } from "../../services/apiClient";

const APPOINTMENT_STATUSES = [
  { key: "COMPLETED", label: "Hoan thanh", color: "#0b5bd3" },
  { key: "CONFIRMED", label: "Da xac nhan", color: "#0f7a8f" },
  { key: "PENDING", label: "Cho xac nhan", color: "#4b5563" },
  { key: "CANCELLED", label: "Da huy", color: "#c81e1e" },
];

const PAYMENT_STATUSES = [
  { key: "PAID", label: "Da thanh toan", color: "#0b5bd3" },
  { key: "PENDING", label: "Cho thanh toan", color: "#0f7a8f" },
  { key: "FAILED", label: "That bai", color: "#4b5563" },
  { key: "CANCELLED", label: "Da huy", color: "#c81e1e" },
];

const APPOINTMENT_LABELS = {
  PENDING: "Cho xac nhan",
  CONFIRMED: "Da xac nhan",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
};

const PAYMENT_LABELS = {
  PENDING: "Cho thanh toan",
  PAID: "Da thanh toan",
  FAILED: "That bai",
  CANCELLED: "Da huy",
};

const DATE_RANGES = [
  { key: "TODAY", label: "Hom nay", days: 1 },
  { key: "WEEK", label: "7 ngay qua", days: 7 },
  { key: "MONTH", label: "30 ngay qua", days: 30 },
  { key: "ALL", label: "Tat ca", days: null },
];

function isInDateRange(value, rangeKey) {
  if (rangeKey === "ALL") return true;
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (rangeKey === "TODAY") {
    return date >= start;
  }

  if (rangeKey === "WEEK") {
    const weekAgo = new Date(start);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return date >= weekAgo;
  }

  if (rangeKey === "MONTH") {
    const monthAgo = new Date(start);
    monthAgo.setDate(monthAgo.getDate() - 29);
    return date >= monthAgo;
  }

  return true;
}

function normalizeList(response) {
  const data = response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatVND(value) {
  return Number(value ?? 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "--";
  return String(value).slice(0, 5);
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

function percent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function getInitials(name) {
  if (!name) return "NA";
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState({
    users: [],
    doctors: [],
    appointments: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("MONTH");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [usersRes, doctorsRes, appointmentsRes, paymentsRes] = await Promise.allSettled([
          apiClient("/users"),
          apiClient("/doctors"),
          apiClient("/appointments"),
          apiClient("/payments"),
        ]);

        if (!active) return;
        setDashboard({
          users: usersRes.status === "fulfilled" ? normalizeList(usersRes.value) : [],
          doctors: doctorsRes.status === "fulfilled" ? normalizeList(doctorsRes.value) : [],
          appointments: appointmentsRes.status === "fulfilled" ? normalizeList(appointmentsRes.value) : [],
          payments: paymentsRes.status === "fulfilled" ? normalizeList(paymentsRes.value) : [],
        });

        const failedMessages = [usersRes, doctorsRes, appointmentsRes, paymentsRes]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message)
          .filter(Boolean);
        if (failedMessages.length > 0) {
          setError(failedMessages[0]);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const filteredAppointments = dashboard.appointments.filter((appointment) =>
      isInDateRange(appointment.appointmentDate ?? appointment.createdAt, dateRange)
    );
    const filteredPayments = dashboard.payments.filter((payment) =>
      isInDateRange(payment.createdAt, dateRange)
    );
    const paidPayments = filteredPayments.filter((payment) => payment.status === "PAID");
    const revenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const paidPercent = percent(paidPayments.length, filteredPayments.length);

    return {
      totalUsers: dashboard.users.length,
      totalDoctors: dashboard.doctors.length,
      totalAppointments: filteredAppointments.length,
      totalRevenue: revenue,
      paidPercent,
      appointmentStatusSource: filteredAppointments,
      paymentStatusSource: filteredPayments,
      recentAppointments: [...filteredAppointments]
        .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
        .slice(0, 4),
      recentPayments: [...filteredPayments]
        .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
        .slice(0, 4),
    };
  }, [dashboard, dateRange]);

  return (
    <AdminWorkspace
      eyebrow="Admin / Dashboard"
      title="Tổng quan hệ thống"
      description="Theo dõi hoạt động và số liệu tổng quan của phòng khám."
      actions={
        <>
          <div className="admin-date-filter">
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setIsDateMenuOpen((current) => !current)}
            >
              <span className="material-symbols-outlined">calendar_month</span>
              {DATE_RANGES.find((range) => range.key === dateRange)?.label ?? "30 ngay qua"}
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {isDateMenuOpen ? (
              <div className="admin-date-filter__menu">
                {DATE_RANGES.map((range) => (
                  <button
                    className={dateRange === range.key ? "admin-date-filter__option admin-date-filter__option--active" : "admin-date-filter__option"}
                    key={range.key}
                    type="button"
                    onClick={() => {
                      setDateRange(range.key);
                      setIsDateMenuOpen(false);
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="button button--primary" type="button">
            <span className="material-symbols-outlined">download</span>
            Xuat bao cao
          </button>
        </>
      }
    >
      {error ? <p className="admin-empty admin-empty--error">{error}</p> : null}

      <div className="admin-stats-row">
        <StatCard icon="group" label="Tong nguoi dung" value={loading ? "--" : formatNumber(summary.totalUsers)} tone="#0b5bd3" trend="+12%" />
        <StatCard icon="medical_services" label="Tong bac si" value={loading ? "--" : formatNumber(summary.totalDoctors)} tone="#0f7a8f" trend="+5%" />
        <StatCard icon="calendar_month" label="Tong lich hen" value={loading ? "--" : formatNumber(summary.totalAppointments)} tone="#4b5563" trend="-2%" trendTone="danger" />
        <StatCard icon="payments" label="Doanh thu" value={loading ? "--" : formatVND(summary.totalRevenue)} tone="#0b5bd3" trend="+18%" />
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-card">
          <PanelHeader title="Trang thai lich hen" />
          <div className="admin-progress-list">
            {APPOINTMENT_STATUSES.map((item) => {
              const count = countByStatus(summary.appointmentStatusSource, item.key);
              const value = percent(count, summary.appointmentStatusSource.length);
              return (
                <ProgressRow
                  key={item.key}
                  label={item.label}
                  value={value}
                  color={item.color}
                  loading={loading}
                />
              );
            })}
          </div>
        </section>

        <section className="admin-dashboard-card">
          <PanelHeader title="Trang thai thanh toan" />
          <div className="admin-payment-status">
            <div
              className="admin-donut"
              style={{ "--paid-percent": `${summary.paidPercent * 3.6}deg` }}
            >
              <strong>{loading ? "--" : `${summary.paidPercent}%`}</strong>
              <span>Da thanh toan</span>
            </div>
            <div className="admin-legend-list">
              {PAYMENT_STATUSES.map((item) => {
                const payments = summary.paymentStatusSource.filter((payment) => payment.status === item.key);
                const amount = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
                return (
                  <div className="admin-legend-row" key={item.key}>
                    <span className="admin-legend-dot" style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <strong>{loading ? "--" : formatVND(amount)}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-dashboard-grid">
        <RecentTable
          title="Lich hen gan day"
          to="/admin/appointments"
          emptyText="Chua co lich hen nao."
          columns={["Benh nhan", "Bac si", "Gio", "Trang thai"]}
        >
          {summary.recentAppointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>
                <PersonCell name={appointment.patientName} />
              </td>
              <td>{appointment.doctorName ?? "--"}</td>
              <td>{formatTime(appointment.startTime)}</td>
              <td>
                <StatusPill status={appointment.status} labels={APPOINTMENT_LABELS} />
              </td>
            </tr>
          ))}
        </RecentTable>

        <RecentTable
          title="Thanh toan gan day"
          to="/admin/payments"
          emptyText="Chua co giao dich nao."
          columns={["Benh nhan", "So tien", "Ngay", "Trang thai"]}
        >
          {summary.recentPayments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <PersonCell name={`Benh nhan #${payment.patientId ?? "--"}`} />
              </td>
              <td>{formatVND(payment.amount)}</td>
              <td>{formatDate(payment.createdAt)}</td>
              <td>
                <StatusPill status={payment.status} labels={PAYMENT_LABELS} />
              </td>
            </tr>
          ))}
        </RecentTable>
      </div>
    </AdminWorkspace>
  );
}

function StatCard({ icon, label, value, tone, trend, trendTone = "success" }) {
  return (
    <article className="admin-stat-card admin-overview-stat">
      <span className="material-symbols-outlined admin-stat-card__icon" style={{ color: tone }}>
        {icon}
      </span>
      <div>
        <p className="admin-stat-card__label">{label}</p>
        <p className="admin-stat-card__value">{value}</p>
      </div>
      <span className={`admin-stat-trend admin-stat-trend--${trendTone}`}>
        <span className="material-symbols-outlined">{trendTone === "danger" ? "trending_down" : "trending_up"}</span>
        {trend}
      </span>
    </article>
  );
}

function PanelHeader({ title }) {
  return (
    <div className="admin-dashboard-card__head">
      <h2>{title}</h2>
      <span className="material-symbols-outlined">more_horiz</span>
    </div>
  );
}

function ProgressRow({ label, value, color, loading }) {
  return (
    <div className="admin-progress-row">
      <div>
        <span>{label}</span>
        <strong>{loading ? "--" : `${value}%`}</strong>
      </div>
      <div className="admin-progress-track">
        <span style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function RecentTable({ title, to, columns, children, emptyText }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="admin-table-card admin-recent-card">
      <div className="admin-recent-card__head">
        <h2>{title}</h2>
        <Link to={to}>Xem tat ca</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? children : (
              <tr>
                <td colSpan={columns.length}>{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PersonCell({ name }) {
  return (
    <div className="admin-person-cell">
      <span>{getInitials(name)}</span>
      <strong>{name ?? "--"}</strong>
    </div>
  );
}

function StatusPill({ status, labels }) {
  const tone = status === "COMPLETED" || status === "PAID"
    ? "success"
    : status === "CONFIRMED"
      ? "primary"
      : status === "PENDING"
        ? "warning"
        : "danger";

  return (
    <span className={`patient-badge patient-badge--${tone}`}>
      {labels[status] ?? status ?? "--"}
    </span>
  );
}
