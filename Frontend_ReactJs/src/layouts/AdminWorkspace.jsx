import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAccessToken, getCurrentUser } from "../services/authService";
import { AdminNotificationProvider, useAdminNotificationContext } from "../contexts/AdminNotificationContext";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/users", label: "Người dùng", icon: "group" },
  { to: "/admin/doctors", label: "Bác sĩ", icon: "medical_services" },
  { to: "/admin/specialties", label: "Chuyên khoa", icon: "category" },
  { to: "/admin/reviews", label: "Đánh giá", icon: "star" },
  { to: "/admin/medicines", label: "Thuốc", icon: "medication" },
  { to: "/admin/appointments", label: "Lịch hẹn", icon: "calendar_month" },
  { to: "/admin/notifications", label: "Thông báo", icon: "notifications" },
  { to: "/admin/payments", label: "Thanh toán", icon: "payments" },
];

function getInitials(name) {
  if (!name) return "AD";
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function AdminWorkspaceInner({ eyebrow, title, description, actions, children }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const { notifications } = useAdminNotificationContext();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((res) => { if (active) setCurrentUser(res?.data ?? null); })
      .catch(() => { if (active) setCurrentUser(null); });
    return () => { active = false; };
  }, []);

  function handleLogout() {
    clearAccessToken();
    navigate("/login");
  }

  return (
    <div className="admin-portal">
      <div className="admin-shell">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__logo">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <strong className="admin-sidebar__brand-title">MedClarity</strong>
              <span className="admin-sidebar__brand-sub">Admin Portal</span>
            </div>
          </div>

          <nav className="admin-sidebar__nav" aria-label="Admin navigation">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="admin-sidebar__logout" type="button" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Đăng xuất</span>
          </button>
        </aside>

        {/* Main content */}
        <section className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <label className="admin-topbar__search" aria-label="Tìm kiếm">
              <span className="material-symbols-outlined">search</span>
              <input type="search" placeholder="Tìm kiếm..." />
            </label>
            <div className="admin-topbar__actions">
              <NavLink className="admin-topbar__icon-btn relative" to="/admin/notifications" aria-label="Thông báo">
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[3px] bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
              <div className="admin-topbar__profile">
                <div className="admin-topbar__avatar">
                  {getInitials(currentUser?.fullName ?? currentUser?.email)}
                </div>
                <div>
                  <strong>{currentUser?.fullName ?? "Admin"}</strong>
                  <span>{currentUser?.email ?? ""}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page header */}
          <header className="admin-page-header">
            <div>
              {eyebrow && <p className="admin-page-header__eyebrow">{eyebrow}</p>}
              <h1>{title}</h1>
              {description && <p className="admin-page-header__desc">{description}</p>}
            </div>
            {actions && <div className="admin-page-header__actions">{actions}</div>}
          </header>

          {/* Page body */}
          <div className="admin-page-body">{children}</div>
        </section>
      </div>
    </div>
  );
}

export function AdminWorkspace(props) {
  return (
    <AdminNotificationProvider>
      <AdminWorkspaceInner {...props} />
    </AdminNotificationProvider>
  );
}
