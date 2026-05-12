import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAccessToken,
  getCurrentUser,
} from "../../services/authService";

const doctorNavItems = [
  { to: "/doctor", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/doctor/appointments", label: "Appointments", icon: "calendar_month" },
  { to: "/doctor/schedules", label: "Schedules", icon: "event_available" },
  { to: "/doctor/profile", label: "Profile", icon: "badge" },
  { to: "/doctor/reviews", label: "Reviews", icon: "star" },
  { to: "/doctor/settings", label: "Settings", icon: "settings" },
];

function getInitials(name) {
  if (!name) {
    return "DR";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DoctorWorkspace({
  eyebrow,
  title,
  description,
  actions,
  children,
}) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await getCurrentUser();
        if (active) {
          setCurrentUser(response?.data ?? null);
        }
      } catch {
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
    navigate("/login");
  }

  return (
    <div className="doctor-portal">
      <div className="doctor-shell doctor-shell--portal">
        <aside className="doctor-sidebar doctor-sidebar--portal">
          <div className="doctor-sidebar__brand doctor-sidebar__brand--portal">
            <div className="doctor-sidebar__logo">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div className="doctor-sidebar__brand-copy">
              <strong className="doctor-sidebar__brand-title">MedClarity</strong>
              <span className="doctor-sidebar__brand-subtitle">Clinical Portal</span>
            </div>
          </div>

          <nav className="doctor-sidebar__nav" aria-label="Doctor navigation">
            {doctorNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `doctor-sidebar__link${isActive ? " doctor-sidebar__link--active" : ""}`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            className="doctor-sidebar__logout"
            type="button"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </aside>

        <section className="doctor-main doctor-main--portal">
          <header className="doctor-topbar">
            <label className="doctor-topbar__search" aria-label="Search doctor portal">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                placeholder="Search patients, visits, or prescriptions..."
              />
            </label>

            <div className="doctor-topbar__actions">
              <NavLink
                className="doctor-topbar__icon-button"
                to="/doctor/notifications"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
              </NavLink>
              <NavLink
                className="doctor-topbar__icon-button"
                to="/doctor/settings"
                aria-label="Settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </NavLink>
              <NavLink className="doctor-topbar__profile" to="/doctor/profile">
                <div className="doctor-topbar__avatar">
                  {getInitials(currentUser?.fullName ?? currentUser?.email)}
                </div>
                <div>
                  <strong>{currentUser?.fullName ?? "Doctor account"}</strong>
                  <span>{currentUser?.email ?? "Secure workspace"}</span>
                </div>
              </NavLink>
            </div>
          </header>

          <header className="doctor-page-header doctor-page-header--portal">
            <div>
              {eyebrow ? (
                <p className="doctor-page-header__eyebrow">{eyebrow}</p>
              ) : null}
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="doctor-page-header__actions">{actions}</div> : null}
          </header>

          <div className="doctor-page-body">{children}</div>
        </section>
      </div>
    </div>
  );
}
