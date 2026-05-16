import { useEffect, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import { apiClient } from "../../services/apiClient";

const STATUS_LIST = ["ALL", "PENDING", "PAID", "FAILED", "CANCELLED"];

const STATUS_META = {
  PENDING:   { label: "Chờ thanh toán", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  PAID:      { label: "Đã thanh toán",  color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  FAILED:    { label: "Thất bại",       color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  CANCELLED: { label: "Đã huỷ",        color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        color: meta.color,
        background: meta.bg,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function formatVND(amount) {
  if (amount == null) return "—";
  return Number(amount).toLocaleString("vi-VN") + " ₫";
}

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const METHOD_LABEL = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  E_WALLET: "Ví điện tử",
};

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null); // payment id đang cập nhật
  const [selected, setSelected] = useState(null); // payment đang xem detail

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient("/payments");
      setPayments(res?.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(paymentId, newStatus) {
    setUpdating(paymentId);
    try {
      const res = await apiClient(`/payments/${paymentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = res?.data;
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: updated?.status ?? newStatus } : p))
      );
      if (selected?.id === paymentId) {
        setSelected((prev) => ({ ...prev, status: updated?.status ?? newStatus }));
      }
    } catch (err) {
      alert("Cập nhật thất bại: " + err.message);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = payments.filter((p) => {
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchSearch =
      !search ||
      String(p.id).includes(search) ||
      String(p.appointmentId).includes(search) ||
      String(p.patientId).includes(search);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === "PAID").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    totalRevenue: payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
  };

  return (
    <AdminWorkspace
      eyebrow="Admin / Thanh toán"
      title="Quản lý thanh toán"
      description="Xem và cập nhật trạng thái các giao dịch thanh toán trong hệ thống."
    >
      {/* Stats row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <span className="material-symbols-outlined admin-stat-card__icon" style={{ color: "#3b82f6" }}>receipt_long</span>
          <div>
            <p className="admin-stat-card__label">Tổng giao dịch</p>
            <p className="admin-stat-card__value">{loading ? "—" : stats.total}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="material-symbols-outlined admin-stat-card__icon" style={{ color: "#16a34a" }}>check_circle</span>
          <div>
            <p className="admin-stat-card__label">Đã thanh toán</p>
            <p className="admin-stat-card__value">{loading ? "—" : stats.paid}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="material-symbols-outlined admin-stat-card__icon" style={{ color: "#d97706" }}>pending</span>
          <div>
            <p className="admin-stat-card__label">Chờ thanh toán</p>
            <p className="admin-stat-card__value">{loading ? "—" : stats.pending}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="material-symbols-outlined admin-stat-card__icon" style={{ color: "var(--primary)" }}>payments</span>
          <div>
            <p className="admin-stat-card__label">Doanh thu</p>
            <p className="admin-stat-card__value" style={{ color: "var(--primary)" }}>
              {loading ? "—" : formatVND(stats.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter + search */}
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-filter-tabs">
            {STATUS_LIST.map((s) => (
              <button
                key={s}
                type="button"
                className={`admin-filter-tab${filterStatus === s ? " admin-filter-tab--active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "ALL" ? "Tất cả" : (STATUS_META[s]?.label ?? s)}
                <span className="admin-filter-tab__count">
                  {s === "ALL" ? payments.length : payments.filter((p) => p.status === s).length}
                </span>
              </button>
            ))}
          </div>
          <label className="admin-search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Tìm theo ID, appointment, bệnh nhân..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        {/* Table */}
        {loading ? (
          <p className="admin-empty">Đang tải...</p>
        ) : error ? (
          <p className="admin-empty admin-empty--error">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">Không có giao dịch nào.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Lịch hẹn</th>
                  <th>Bệnh nhân</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="admin-table__row">
                    <td className="admin-table__id">#{p.id}</td>
                    <td>#{p.appointmentId}</td>
                    <td>#{p.patientId}</td>
                    <td>{METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod ?? "—"}</td>
                    <td style={{ fontWeight: 600 }}>{formatVND(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ color: "var(--text-soft)", fontSize: "13px" }}>
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => setSelected(p)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {p.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="admin-action-btn admin-action-btn--success"
                              disabled={updating === p.id}
                              onClick={() => handleUpdateStatus(p.id, "PAID")}
                              title="Xác nhận đã thanh toán"
                            >
                              <span className="material-symbols-outlined">check_circle</span>
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn admin-action-btn--danger"
                              disabled={updating === p.id}
                              onClick={() => handleUpdateStatus(p.id, "CANCELLED")}
                              title="Huỷ thanh toán"
                            >
                              <span className="material-symbols-outlined">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="admin-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Chi tiết thanh toán #{selected.id}</h2>
              <button type="button" className="admin-modal__close" onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-detail-grid">
                <div className="admin-detail-row">
                  <span>ID thanh toán</span>
                  <strong>#{selected.id}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Lịch hẹn</span>
                  <strong>#{selected.appointmentId}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Bệnh nhân</span>
                  <strong>#{selected.patientId}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Phương thức</span>
                  <strong>{METHOD_LABEL[selected.paymentMethod] ?? selected.paymentMethod ?? "—"}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Số tiền</span>
                  <strong style={{ color: "var(--primary)", fontSize: "18px" }}>{formatVND(selected.amount)}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Trạng thái</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="admin-detail-row">
                  <span>Ngày tạo</span>
                  <strong>{formatDateTime(selected.createdAt)}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Cập nhật lúc</span>
                  <strong>{formatDateTime(selected.updatedAt)}</strong>
                </div>
              </div>

              {selected.status === "PENDING" && (
                <div className="admin-modal__footer">
                  <p style={{ fontSize: "13px", color: "var(--text-soft)", marginBottom: "12px" }}>
                    Cập nhật trạng thái:
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="mc-btn mc-btn--primary"
                      disabled={updating === selected.id}
                      onClick={() => handleUpdateStatus(selected.id, "PAID")}
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Xác nhận đã thanh toán
                    </button>
                    <button
                      type="button"
                      className="mc-btn mc-btn--outline"
                      disabled={updating === selected.id}
                      onClick={() => handleUpdateStatus(selected.id, "FAILED")}
                    >
                      Đánh dấu thất bại
                    </button>
                    <button
                      type="button"
                      className="mc-btn mc-btn--outline"
                      style={{ borderColor: "var(--error)", color: "var(--error)" }}
                      disabled={updating === selected.id}
                      onClick={() => handleUpdateStatus(selected.id, "CANCELLED")}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminWorkspace>
  );
}
