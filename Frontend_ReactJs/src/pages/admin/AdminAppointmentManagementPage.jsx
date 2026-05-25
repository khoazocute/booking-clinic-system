import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminNotificationContext } from "../../contexts/AdminNotificationContext";
import { getAllAppointments, updateAppointmentStatus } from "../../services/appointmentService";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  PENDING:     { label: "Chờ xác nhận", bg: "bg-secondary-fixed/50",    text: "text-on-secondary-container" },
  CONFIRMED:   { label: "Đã xác nhận", bg: "bg-primary/10",            text: "text-primary" },
  COMPLETED:   { label: "Hoàn tất", bg: "bg-tertiary-container/20", text: "text-tertiary-container" },
  CANCELLED:   { label: "Đã hủy", bg: "bg-error-container",       text: "text-on-error-container" },
  IN_PROGRESS: { label: "Đang khám", bg: "bg-secondary-fixed/50",    text: "text-on-secondary-container" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, bg: "bg-surface-container-low", text: "text-on-surface-variant" };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  return `${String(hour).padStart(2, "0")}:${minuteStr}`;
}

// Trả về mảng 5 ngày (Mon–Fri) của tuần hiện tại dạng "YYYY-MM-DD"
function getCurrentWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6"];

const AdminAppointmentManagementPage = () => {
  const { notifications, connected } = useAdminNotificationContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [chartMode, setChartMode] = useState("CONFIRMED_PENDING");
  const prevNotifCountRef = useRef(null);

  const CHART_MODES = [
    { value: "CONFIRMED",           label: "Chỉ đã xác nhận" },
    { value: "CONFIRMED_COMPLETED", label: "Đã xác nhận + hoàn tất" },
    { value: "CONFIRMED_PENDING",   label: "Đã xác nhận + chờ xác nhận" },
    { value: "ALL_ACTIVE",          label: "Tất cả lịch đang hoạt động" },
    { value: "CANCELLED",           label: "Chỉ lịch đã hủy" },
  ];

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await getAllAppointments();
      setAppointments(res?.data || []);
      setError("");
    } catch {
      setError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Khi có notification APPOINTMENT mới → tự reload
  useEffect(() => {
    if (prevNotifCountRef.current === null) {
      prevNotifCountRef.current = notifications.length;
      return;
    }
    if (notifications.length > prevNotifCountRef.current) {
      const newOnes = notifications.slice(0, notifications.length - prevNotifCountRef.current);
      if (newOnes.some((n) => n.referenceType === "APPOINTMENT")) {
        fetchAppointments();
      }
      prevNotifCountRef.current = notifications.length;
    }
  }, [notifications.length, fetchAppointments]);

  // --- Metrics ---
  const todayStr = new Date().toISOString().split("T")[0];
  const total      = appointments.length;
  const confirmed  = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completed  = appointments.filter((a) => a.status === "COMPLETED").length;
  const pending    = appointments.filter((a) => a.status === "PENDING").length;
  const cancelled  = appointments.filter((a) => a.status === "CANCELLED").length;

  const confirmedToday = appointments.filter(
    (a) => a.status === "CONFIRMED" && a.appointmentDate === todayStr
  ).length;

  const confirmRate = total > 0
    ? Math.round(((confirmed + completed) / total) * 100)
    : 0;

  const morning   = appointments.filter((a) => a.startTime && parseInt(a.startTime, 10) < 12).length;
  const afternoon = appointments.filter((a) => a.startTime && parseInt(a.startTime, 10) >= 12).length;

  // --- Weekly Capacity (tính từ data thực theo chartMode) ---
  const weekDays = getCurrentWeekDays();

  function countByDate(dateStr, statuses) {
    return appointments.filter(
      (a) => a.appointmentDate === dateStr && statuses.includes(a.status)
    ).length;
  }

  const weeklyData = weekDays.map((dateStr, i) => {
    const isToday = dateStr === todayStr;
    if (chartMode === "CONFIRMED") {
      const count = countByDate(dateStr, ["CONFIRMED"]);
      return { label: WEEK_LABELS[i], primary: count, secondary: 0, total: count, isToday };
    }
    if (chartMode === "CONFIRMED_COMPLETED") {
      const count = countByDate(dateStr, ["CONFIRMED", "COMPLETED"]);
      return { label: WEEK_LABELS[i], primary: count, secondary: 0, total: count, isToday };
    }
    if (chartMode === "CONFIRMED_PENDING") {
      const confirmed = countByDate(dateStr, ["CONFIRMED"]);
      const pending   = countByDate(dateStr, ["PENDING"]);
      return { label: WEEK_LABELS[i], primary: confirmed, secondary: pending, total: confirmed + pending, isToday };
    }
    if (chartMode === "CANCELLED") {
      const count = countByDate(dateStr, ["CANCELLED"]);
      return { label: WEEK_LABELS[i], primary: count, secondary: 0, total: count, isToday };
    }
    // ALL_ACTIVE: exclude CANCELLED
    const count = countByDate(dateStr, ["CONFIRMED", "COMPLETED", "PENDING"]);
    return { label: WEEK_LABELS[i], primary: count, secondary: 0, total: count, isToday };
  });

  const maxWeekCount = Math.max(...weeklyData.map((d) => d.total), 1);

  // --- Filter & Search ---
  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.patientName?.toLowerCase().includes(q) || a.doctorName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusUpdate = async (id, status, cancelReason = "") => {
    try {
      setUpdating(true);
      await updateAppointmentStatus(id, status, cancelReason);
      await fetchAppointments();
      setCancelTarget(null);
    } catch (e) {
      setError(e?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  function getPageNumbers() {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
    );
  }

  const getAvatarUrl = (id) =>
    `https://api.dicebear.com/7.x/notionists/svg?seed=${id}&backgroundColor=b3c5ff`;

  return (
    <div className="w-full">

      {/* Summary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-primary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">TỔNG LỊCH HẸN</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">{total}</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-outline"}`} />
              <span className="text-body-sm text-on-surface-variant">{connected ? "Đang kết nối" : "Mất kết nối"}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-secondary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">ĐÃ XÁC NHẬN HÔM NAY</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">{confirmedToday}</span>
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span className="text-body-sm">{confirmRate}% tỷ lệ</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-primary-container">
          <span className="font-label-caps text-label-caps text-on-surface-variant">CA SÁNG</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">{morning}</span>
            <span className="text-body-sm text-on-surface-variant">08:00 - 12:00</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-tertiary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">CA CHIỀU</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">{afternoon}</span>
            <span className="text-body-sm text-on-surface-variant">13:00 - 18:00</span>
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-md">
          <h2 className="font-h3 text-h3 text-on-surface">Danh sách lịch hẹn</h2>
          <div className="flex flex-wrap items-center gap-sm">
            <div className="flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="bg-transparent border-none outline-none font-body-sm w-48 text-on-surface placeholder:text-outline"
                placeholder="Tìm bệnh nhân hoặc bác sĩ..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="bg-surface-container-low border-none rounded-lg text-body-sm py-2 px-sm focus:ring-primary outline-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button
              className="bg-surface-container-low border border-outline-variant/30 font-button px-md py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-all disabled:opacity-50"
              onClick={fetchAppointments}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              {loading ? "Đang làm mới..." : "Làm mới"}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-md py-sm flex items-center gap-sm bg-error-container/30 border-b border-error/20">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <p className="text-body-sm text-error">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                <th className="px-md py-4">ID</th>
                <th className="px-md py-4">Bệnh nhân</th>
                <th className="px-md py-4">Bác sĩ</th>
                <th className="px-md py-4">Ngày & giờ</th>
                <th className="px-md py-4">Lý do</th>
                <th className="px-md py-4">Trạng thái</th>
                <th className="px-md py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-md py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-sm animate-spin">refresh</span>
                    Đang tải lịch hẹn...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-md py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-sm">calendar_month</span>
                    Không tìm thấy lịch hẹn.
                  </td>
                </tr>
              ) : (
                paginated.map((appt) => {
                  const sc = getStatusConfig(appt.status);
                  const canConfirm   = appt.status === "PENDING";
                  const canComplete  = appt.status === "CONFIRMED";
                  const canCancel    = appt.status === "PENDING" || appt.status === "CONFIRMED";
                  const isCancelling = cancelTarget?.id === appt.id;

                  return (
                    <tr key={appt.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-md py-4 font-body-sm font-bold text-primary">
                        #APT-{String(appt.id).padStart(4, "0")}
                      </td>
                      <td className="px-md py-4">
                        <div className="flex items-center gap-3">
                          <img
                            alt="Bệnh nhân"
                            className="w-8 h-8 rounded-full object-cover"
                            src={getAvatarUrl(appt.patientId || appt.id)}
                          />
                          <div>
                            <p className="font-body-md font-bold">{appt.patientName || "—"}</p>
                            <p className="text-[12px] text-on-surface-variant">ID: P-{appt.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px]">medical_services</span>
                          </div>
                          <p className="font-body-md">{appt.doctorName || "—"}</p>
                        </div>
                      </td>
                      <td className="px-md py-4">
                        <p className="font-body-md">{formatDate(appt.appointmentDate)}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                        </p>
                      </td>
                      <td className="px-md py-4">
                        <span className="font-body-sm">{appt.reason || "Khám tổng quát"}</span>
                      </td>
                      <td className="px-md py-4">
                        <span className={`${sc.bg} ${sc.text} px-3 py-1 rounded-full text-[12px] font-bold`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-md py-4 text-right">
                        {isCancelling ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              className="bg-surface-container border border-outline-variant/50 rounded-lg px-2 py-1 text-sm outline-none w-32 focus:border-primary"
                              placeholder="Lý do..."
                              value={cancelTarget.reason}
                              autoFocus
                              onChange={(e) => setCancelTarget((t) => ({ ...t, reason: e.target.value }))}
                              onKeyDown={(e) => e.key === "Escape" && setCancelTarget(null)}
                            />
                            <button
                              className="p-1 hover:bg-error/10 text-error rounded-lg disabled:opacity-50"
                              disabled={updating}
                              onClick={() => handleStatusUpdate(appt.id, "CANCELLED", cancelTarget.reason)}
                            >
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            </button>
                            <button
                              className="p-1 hover:bg-surface-container-high text-on-surface-variant rounded-lg"
                              onClick={() => setCancelTarget(null)}
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canConfirm && (
                              <button
                                className="p-2 hover:bg-primary/10 text-primary rounded-lg disabled:opacity-50"
                                title="Xác nhận"
                                disabled={updating}
                                onClick={() => handleStatusUpdate(appt.id, "CONFIRMED")}
                              >
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                              </button>
                            )}
                            {canComplete && (
                              <button
                                className="p-2 hover:bg-secondary/10 text-secondary rounded-lg disabled:opacity-50"
                                title="Hoàn tất"
                                disabled={updating}
                                onClick={() => handleStatusUpdate(appt.id, "COMPLETED")}
                              >
                                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                              </button>
                            )}
                            {canCancel && (
                              <button
                                className="p-2 hover:bg-error/10 text-error rounded-lg disabled:opacity-50"
                                title="Hủy"
                                disabled={updating}
                                onClick={() => setCancelTarget({ id: appt.id, reason: "" })}
                              >
                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-md">
            <p className="text-body-sm text-on-surface-variant">
              Hiển thị {(page - 1) * PAGE_SIZE + 1} đến {Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} mục
            </p>
            <div className="flex items-center gap-xs">
              <button
                className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all disabled:opacity-30"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {getPageNumbers().map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-xs">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-on-surface-variant text-body-sm px-xs">...</span>
                  )}
                  <button
                    className={`w-8 h-8 rounded-lg font-bold text-body-sm transition-all ${
                      p === page
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant hover:bg-surface-container-highest"
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all disabled:opacity-30"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom section: Weekly Capacity + Pending Alert */}
      <section className="mt-lg grid grid-cols-1 lg:grid-cols-3 gap-gutter">

        {/* Weekly Capacity — tính từ data thực */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between mb-md gap-sm">
            <div>
              <h3 className="font-h3 text-h3">Weekly Capacity</h3>
              <p className="text-body-sm text-on-surface-variant">
                Tuần này · {weeklyData.reduce((s, d) => s + d.total, 0)} lịch hẹn
              </p>
            </div>
            <select
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-sm py-1.5 px-sm outline-none flex-shrink-0"
              value={chartMode}
              onChange={(e) => setChartMode(e.target.value)}
            >
              {CHART_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Legend cho stacked mode */}
          {chartMode === "CONFIRMED_PENDING" && (
            <div className="flex items-center gap-md mb-sm">
              <div className="flex items-center gap-xs text-body-sm text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                Confirmed
              </div>
              <div className="flex items-center gap-xs text-body-sm text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-primary/30 inline-block" />
                Pending
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-2 h-36">
            {weeklyData.map((day) => {
              const primaryPct   = Math.round((day.primary   / maxWeekCount) * 100);
              const secondaryPct = Math.round((day.secondary / maxWeekCount) * 100);
              const color = chartMode === "CANCELLED" ? "bg-error" : day.isToday ? "bg-secondary" : "bg-primary";
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-body-sm font-bold text-on-surface-variant">{day.total}</span>
                  <div className="w-full bg-primary/10 rounded-t-lg h-24 relative overflow-hidden" title={`${day.label}: ${day.total} lịch`}>
                    {/* Secondary (pending) — nằm dưới */}
                    {day.secondary > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-primary/30 transition-all duration-500"
                        style={{ height: `${primaryPct + secondaryPct}%` }}
                      />
                    )}
                    {/* Primary — nằm trên */}
                    <div
                      className={`absolute bottom-0 w-full ${color} rounded-t-lg transition-all duration-500`}
                      style={{ height: `${primaryPct}%` }}
                    />
                  </div>
                  <span className={`font-label-caps text-[10px] ${day.isToday ? "text-secondary font-bold" : "text-on-surface-variant"}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Alert — tính từ data thực */}
        <div className={`p-md rounded-xl shadow-lg flex flex-col justify-between ${pending > 0 ? "bg-primary text-on-primary" : "bg-surface-container-lowest border border-outline-variant/30"}`}>
          <div>
            <span
              className="material-symbols-outlined text-[32px] mb-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {pending > 0 ? "pending_actions" : "check_circle"}
            </span>
            <h3 className="font-h3 text-h3 leading-tight">
              {pending > 0 ? "Chờ xử lý" : "Đã xử lý hết"}
            </h3>
            <p className={`font-body-sm mt-2 ${pending > 0 ? "opacity-90" : "text-on-surface-variant"}`}>
              {pending > 0
                ? `Còn ${pending} lịch hẹn đang chờ xác nhận. Vui lòng xem xét và xác nhận.`
                : "Tất cả lịch hẹn đã được xử lý. Không có lịch hẹn nào đang chờ."}
            </p>
            {pending > 0 && (
              <div className={`mt-md flex items-center gap-sm text-body-sm opacity-80`}>
                <span className="material-symbols-outlined text-[16px]">info</span>
                {cancelled} đã huỷ · {confirmed + completed} đã xác nhận
              </div>
            )}
          </div>
          <button
            className={`w-full font-button py-3 rounded-lg mt-md transition-all ${
              pending > 0
                ? "bg-on-primary text-primary hover:bg-inverse-on-surface"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
            onClick={() => { setStatusFilter("PENDING"); setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            {pending > 0 ? `Xem ${pending} lịch chờ` : "Xem tất cả lịch hẹn"}
          </button>
        </div>
      </section>

      {/* FAB refresh */}
      <button
        className="fixed bottom-10 right-10 bg-primary text-on-primary w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
        title="Làm mới"
        onClick={fetchAppointments}
      >
        <span className="material-symbols-outlined text-[24px]">refresh</span>
      </button>
    </div>
  );
};

export default AdminAppointmentManagementPage;
