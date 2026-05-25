import { useEffect, useMemo, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import { getUsers } from "../../services/userService";

const PAGE_SIZE = 10;

function normalizeList(response) {
  const data = response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

function initials(fullName, email) {
  const source = (fullName || email || "US").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
}

function statusMeta(status) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "INACTIVE") return { label: "Ngưng hoạt động", dot: "#94a3b8", badge: "neutral" };
  return { label: "Hoạt động", dot: "#22c55e", badge: "success" };
}

function roleMeta(role) {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized === "ADMIN") return { label: "Quản trị viên", tone: "#1f2937", bg: "#e5e7eb" };
  if (normalized === "DOCTOR") return { label: "Bác sĩ", tone: "#1d4ed8", bg: "#dbeafe" };
  return { label: "Bệnh nhân", tone: "#0f766e", bg: "#ccfbf1" };
}

export function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await getUsers();
      const list = normalizeList(response);
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? 0).getTime();
        return dateB - dateA;
      });
      setUsers(list);
    } catch (requestError) {
      setError(requestError.message ?? "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return users.filter((user) => {
      const role = String(user.role ?? "").toUpperCase();
      const status = String(user.status ?? "ACTIVE").toUpperCase();

      if (roleFilter !== "ALL" && role !== roleFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!keyword) return true;
      const block = [user.fullName, user.email, user.phone].filter(Boolean).join(" ").toLowerCase();
      return block.includes(keyword);
    });
  }, [users, searchKeyword, roleFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    const total = users.length;
    const doctors = users.filter((x) => String(x.role ?? "").toUpperCase() === "DOCTOR").length;
    const patients = users.filter((x) => String(x.role ?? "").toUpperCase() === "PATIENT").length;
    const inactive = users.filter((x) => String(x.status ?? "").toUpperCase() === "INACTIVE").length;
    return { total, doctors, patients, inactive };
  }, [users]);

  return (
    <AdminWorkspace
      eyebrow="Admin / Người dùng"
      title="Quản lý người dùng"
      description="Quản lý, lọc và theo dõi toàn bộ người dùng trong hệ thống."
      actions={
        <button className="button button--primary" type="button" disabled title="Backend chưa hỗ trợ API tạo user">
          <span className="material-symbols-outlined">person_add</span>
          Thêm người dùng
        </button>
      }
    >
      {error ? (
        <div className="admin-alert admin-alert--error">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      ) : null}

      <section className="admin-stats-row">
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Tổng người dùng</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.total}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Bác sĩ hoạt động</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.doctors}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Tổng bệnh nhân</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.patients}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Người dùng ngưng hoạt động</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.inactive}</p>
          </div>
        </div>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
          <label className="admin-search-box" aria-label="Tìm user" style={{ minWidth: 320, flex: 1 }}>
            <span className="material-symbols-outlined">person_search</span>
            <input
              type="search"
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 140 }}>
            <span>Vai trò</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="PATIENT">Bệnh nhân</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 140 }}>
            <span>Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </label>

          <button className="button button--ghost" type="button" onClick={loadUsers}>
            <span className="material-symbols-outlined">refresh</span>
            Làm mới
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    Không có người dùng phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => {
                  const status = statusMeta(user.status);
                  const role = roleMeta(user.role);
                  return (
                    <tr key={user.id}>
                      <td>#{user.id ?? "--"}</td>
                      <td>
                        <div className="admin-person-cell">
                          <span>{initials(user.fullName, user.email)}</span>
                          <strong>{user.fullName ?? "--"}</strong>
                        </div>
                      </td>
                      <td>{user.email ?? "--"}</td>
                      <td>{user.phone ?? "--"}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 9999,
                            padding: "2px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            color: role.tone,
                            background: role.bg,
                          }}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: status.dot }} />
                          <span>{status.label}</span>
                        </div>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="admin-action-btn" type="button" disabled title="Backend chưa hỗ trợ edit user">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="admin-action-btn admin-action-btn--danger" type="button" disabled title="Backend chưa hỗ trợ delete user">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-toolbar" style={{ justifyContent: "space-between" }}>
          <span>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + (pagedUsers.length > 0 ? 1 : 0)}-
            {(currentPage - 1) * PAGE_SIZE + pagedUsers.length} trong {filteredUsers.length} người dùng
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </AdminWorkspace>
  );
}
