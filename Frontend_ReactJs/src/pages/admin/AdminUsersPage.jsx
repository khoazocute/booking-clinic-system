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
  if (normalized === "INACTIVE") return { label: "Inactive", dot: "#94a3b8", badge: "neutral" };
  return { label: "Active", dot: "#22c55e", badge: "success" };
}

function roleMeta(role) {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized === "ADMIN") return { label: "Admin", tone: "#1f2937", bg: "#e5e7eb" };
  if (normalized === "DOCTOR") return { label: "Doctor", tone: "#1d4ed8", bg: "#dbeafe" };
  return { label: "Patient", tone: "#0f766e", bg: "#ccfbf1" };
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
      title="User Management"
      description="Quản lý, lọc và theo dõi toàn bộ người dùng trong hệ thống."
      actions={
        <button className="button button--primary" type="button" disabled title="Backend chưa hỗ trợ API tạo user">
          <span className="material-symbols-outlined">person_add</span>
          Add New User
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
            <p className="admin-stat-card__label">Total Users</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.total}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Active Clinicians</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.doctors}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Total Patients</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.patients}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Inactive Users</p>
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
              placeholder="Search by name, email or phone..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 140 }}>
            <span>Role</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PATIENT">Patient</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 140 }}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">Any Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <button className="button button--ghost" type="button" onClick={loadUsers}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
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
            Showing {(currentPage - 1) * PAGE_SIZE + (pagedUsers.length > 0 ? 1 : 0)}-
            {(currentPage - 1) * PAGE_SIZE + pagedUsers.length} of {filteredUsers.length} users
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>Page {currentPage}/{totalPages}</span>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </AdminWorkspace>
  );
}
