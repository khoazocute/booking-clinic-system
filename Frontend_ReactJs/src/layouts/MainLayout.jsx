import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
} from "../services/authService";
import { getMyNotifications } from "../services/patientPortalService";

const publicNavigation = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/specialties", label: "Chuyên khoa" },
  { to: "/doctors", label: "Bác sĩ" },
];

export function MainLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    let active = true;

    async function loadUnreadNotifications() {
      if (!currentUser) {
        setUnreadCount(0);
        return;
      }

      try {
        const notifications = await getMyNotifications();
        if (active) {
          setUnreadCount(notifications.filter((item) => !item.isRead).length);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadNotifications();

    return () => {
      active = false;
    };
  }, [currentUser]);

  function handleLogout() {
    clearAccessToken();
    setCurrentUser(null);
    setUnreadCount(0);
    navigate("/");
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-container site-header__inner">
          <NavLink to="/" end className="brand-mark">
            <strong>MediCare</strong>
          </NavLink>

          <nav className="site-nav" aria-label="Primary">
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
            {currentUser ? (
              <NavLink
                to="/my-appointments"
                className={({ isActive }) =>
                  "site-nav__link" + (isActive ? " site-nav__link--active" : "")
                }
              >
                Lich hen cua toi
              </NavLink>
            ) : null}
          </nav>

          <div className="site-actions">
            {currentUser ? (
              <>
                <Link className="site-icon-link" to="/notifications" aria-label="Thong bao">
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 ? (
                    <span className="site-icon-link__badge">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
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
                  Login
                </Link>
                <Link className="button button--primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
