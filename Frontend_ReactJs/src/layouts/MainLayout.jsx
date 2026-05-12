import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
} from "../services/authService";

const publicNavigation = [
  { to: "/", label: "Home", end: true },
  { to: "/#doctors", label: "Doctors" },
  { to: "/#specialties", label: "Specialties" },
  { to: "/#booking", label: "Booking" },
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
              <a key={item.label} href={item.to} className="site-nav__link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-actions">
            {currentUser ? (
              <>
                <Link to="/profile" className="site-user" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="site-user__label">Xin chào</span>
                  <strong>{currentUser.fullName ?? currentUser.email}</strong>
                </Link>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
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
