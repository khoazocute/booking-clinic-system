import { useState } from "react";
import { markAsRead, markAllAsRead } from "../../services/notificationService";
import { useAdminNotificationContext } from "../../contexts/AdminNotificationContext";

const TYPE_CONFIG = {
  APPOINTMENT_CONFIRMED: { label: "SUCCESS", bg: "bg-primary-container/10", text: "text-primary" },
  APPOINTMENT_CANCELLED: { label: "WARNING", bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed-variant" },
  PAYMENT_COMPLETED:     { label: "SUCCESS", bg: "bg-primary-container/10", text: "text-primary" },
  PAYMENT_UPDATED:       { label: "WARNING", bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed-variant" },
  PAYMENT_CREATED:       { label: "INFO",    bg: "bg-secondary-container/20", text: "text-secondary" },
  PRESCRIPTION_CREATED:  { label: "INFO",    bg: "bg-secondary-container/20", text: "text-secondary" },
  LOW_STOCK:             { label: "ALERT",   bg: "bg-error-container", text: "text-on-error-container" },
  OUT_OF_STOCK:          { label: "ALERT",   bg: "bg-error-container", text: "text-on-error-container" },
};

const DEFAULT_TYPE = { label: "INFO", bg: "bg-secondary-container/20", text: "text-secondary" };

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || DEFAULT_TYPE;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

const ITEMS_PER_PAGE = 10;

const AdminNotificationManagementPage = () => {
  const { notifications, loading, connected, markOneAsRead, markAllRead } = useAdminNotificationContext();
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      markOneAsRead(id);
    } catch {
      // silent fail
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      markAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  // Stats
  const stats = notifications.reduce(
    (acc, n) => {
      const cfg = getTypeConfig(n.type);
      if (cfg.label === "ALERT") acc.alert++;
      else if (cfg.label === "SUCCESS") acc.success++;
      else if (cfg.label === "WARNING") acc.warning++;
      else acc.info++;
      return acc;
    },
    { alert: 0, success: 0, warning: 0, info: 0 }
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(notifications.length / ITEMS_PER_PAGE));
  const paginated = notifications.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
        <div>
          <p className="admin-page-header__eyebrow">Admin / Notifications</p>
          <div className="flex items-center gap-sm">
            <h1 style={{ fontFamily: "Manrope", fontSize: "26px", fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
              Notification Management
            </h1>
            <span className={`flex items-center gap-xs text-label-caps font-label-caps px-sm py-xs rounded-full ${connected ? "bg-primary-container/20 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-primary" : "bg-outline"}`}></span>
              {connected ? "Live" : "Offline"}
            </span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant mt-xs">
            Manage and track all medical facility alerts and communications.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {unreadCount > 0 && (
            <span className="px-sm py-xs rounded-full bg-primary text-on-primary text-label-caps font-label-caps">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-xs px-md py-sm text-primary border border-primary rounded-lg font-button hover:bg-primary-fixed-dim transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined">done_all</span>
            Mark all as read
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
        <StatCard icon="error" iconBg="bg-error-container" iconColor="text-error" label="ALERTS" count={stats.alert} />
        <StatCard icon="info" iconBg="bg-secondary-container/20" iconColor="text-secondary" label="INFO" count={stats.info} />
        <StatCard icon="check_circle" iconBg="bg-primary-container/10" iconColor="text-primary" label="SUCCESS" count={stats.success} />
        <StatCard icon="warning" iconBg="bg-on-tertiary-fixed/10" iconColor="text-tertiary" label="WARNING" count={stats.warning} />
      </div>

      {/* List */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/50">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-sm px-md py-sm bg-surface-container border-b border-outline-variant text-label-caps font-label-caps text-on-surface-variant">
          <div className="col-span-1 flex justify-center">STATUS</div>
          <div className="col-span-2">TYPE</div>
          <div className="col-span-6">NOTIFICATION</div>
          <div className="col-span-2 text-right">TIME</div>
          <div className="col-span-1"></div>
        </div>

        {loading && (
          <div className="px-md py-xl text-center text-on-surface-variant">Đang tải thông báo...</div>
        )}

        {!loading && paginated.length === 0 && (
          <div className="px-md py-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl block mb-sm">notifications_off</span>
            Chưa có thông báo nào
          </div>
        )}

        {!loading && paginated.map((n) => {
          const cfg = getTypeConfig(n.type);
          return (
            <div
              key={n.id}
              className={`grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center ${
                !n.isRead ? "bg-primary-container/5" : "opacity-80"
              }`}
            >
              <div className="col-span-1 flex justify-center">
                {!n.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-xs">
                <span className={`px-3 py-1 rounded-full text-label-caps font-bold ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="col-span-6">
                <p className={`text-body-md text-on-surface ${!n.isRead ? "font-bold" : "font-body-md"}`}>
                  {n.title}
                </p>
                <p className="text-body-sm text-on-surface-variant">{n.message}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-body-sm text-on-surface-variant">{formatTime(n.createdAt)}</p>
              </div>
              <div className="col-span-1 flex justify-end">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Đánh dấu đã đọc"
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-xl"
                  >
                    mark_email_read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {!loading && notifications.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-lg">
          <p className="text-body-sm text-on-surface-variant">
            Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, notifications.length)} trong số {notifications.length} thông báo
          </p>
          <div className="flex items-center gap-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${
                  p === page
                    ? "bg-primary text-on-primary shadow-sm"
                    : "border border-outline-variant hover:bg-surface-container"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, iconBg, iconColor, label, count }) {
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-outline-variant/30">
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-label-caps font-label-caps text-on-surface-variant">{label}</p>
        <p className="text-h3 font-h3">{String(count).padStart(2, "0")}</p>
      </div>
    </div>
  );
}

export default AdminNotificationManagementPage;
