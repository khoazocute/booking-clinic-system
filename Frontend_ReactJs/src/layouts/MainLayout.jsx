import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
} from "../services/authService";
import { useNotifications } from "../hooks/useNotifications";
import { PatientAiChatWidget } from "../components/patient/PatientAiChatWidget";

const publicNavigation = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/specialties", label: "Chuyên khoa" },
  { to: "/doctors", label: "Bác sĩ" },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const { unreadCount } = useNotifications();

  const isPatientPage = [
    "/profile",
    "/change-password",
    "/my-appointments",
    "/medical-records",
    "/prescriptions",
    "/reviews",
    "/notifications",
    "/booking",
    "/specialties",
    "/doctors"
  ].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      if (!getAccessToken()) {
        if (active) {
          setCurrentUser(null);
        }
        return;
      }

      try {
        const response = await getCurrentUser();
        if (active) {
          setCurrentUser(response?.data ?? null);
        }
      } catch {
        clearAccessToken();
        if (active) {
          setCurrentUser(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    clearAccessToken();
    setCurrentUser(null);
    navigate("/");
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-container site-header__inner">
          <NavLink to="/" end className="brand-mark">
            <strong>MediCare</strong>
          </NavLink>

          <nav className="site-nav" aria-label="Điều hướng chính">
            {publicNavigation.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  "site-nav__link" + (isActive ? " site-nav__link--active" : "")
                }
              >
                {item.label}
              </NavLink>
            ))}
            {currentUser?.role?.toUpperCase() === "PATIENT" ? (
              <NavLink
                to="/my-appointments"
                className={({ isActive }) =>
                  "site-nav__link" + (isActive ? " site-nav__link--active" : "")
                }
              >
                Lịch khám của tôi
              </NavLink>
            ) : null}
          </nav>

          <div className="site-actions">
            {currentUser ? (
              <>
                <Link className="site-icon-link" to={currentUser.role?.toUpperCase() === "ADMIN" ? "/admin/notifications" : "/notifications"} aria-label="Thông báo">
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 ? (
                    <span className="site-icon-link__badge">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
                {currentUser.role?.toUpperCase() === "ADMIN" && (
                  <Link className="button button--ghost" to="/admin" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>admin_panel_settings</span>
                    Quản trị
                  </Link>
                )}

                <Link to="/profile" className="site-user" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="site-user__label">Xin chào</span>
                  <strong>{currentUser.fullName ?? currentUser.email}</strong>
                </Link>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link className="button button--ghost" to="/login">
                  Đăng nhập
                </Link>
                <Link className="button button--primary" to="/register">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={isPatientPage ? "patient-layout-bg" : ""}>
        <Outlet />
      </main>

      {currentUser?.role?.toUpperCase() === "PATIENT" ? (
        <PatientAiChatWidget />
      ) : null}

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand-col">
            <span className="site-footer__brand-name">MediCare</span>
            <p className="site-footer__tagline">
              Nền tảng đặt lịch khám bệnh trực tuyến — kết nối bệnh nhân với bác sĩ nhanh chóng, tiện lợi và an toàn.
            </p>
          </div>

          <div>
            <p className="site-footer__col-title">Khám phá</p>
            <ul className="site-footer__links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/specialties">Chuyên khoa</Link></li>
              <li><Link to="/doctors">Bác sĩ</Link></li>
              <li><Link to="/booking">Đặt lịch khám</Link></li>
            </ul>
          </div>

          <div>
            <p className="site-footer__col-title">Liên hệ</p>
            <div className="site-footer__contact-item">
              <span className="material-symbols-outlined">location_on</span>
              Tp. Hồ Chí Minh, Việt Nam
            </div>
            <div className="site-footer__contact-item">
              <span className="material-symbols-outlined">mail</span>
              support@medicare.vn
            </div>
            <div className="site-footer__contact-item">
              <span className="material-symbols-outlined">call</span>
              1800 1234
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span className="site-footer__copy">© 2026 MediCare. Bảo lưu mọi quyền.</span>
        </div>
      </footer>
    </div>
  );
}
