import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
} from "../services/authService";

const publicNavigation = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/specialties", label: "Chuyên khoa" },
  { to: "/doctors", label: "Bác sĩ" },
];

export function MainLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

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
          </nav>

          <div className="site-actions">
            {currentUser ? (
              <>
                <div className="site-user">
                  <span className="site-user__label">Xin chào</span>
                  <strong>{currentUser.fullName ?? currentUser.email}</strong>
                </div>
                <Link className="button button--soft" to="/profile">
                  Hồ sơ
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
