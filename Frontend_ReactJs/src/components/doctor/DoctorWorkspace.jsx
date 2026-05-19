import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  clearAccessToken,
  getCurrentUser,
} from "../../services/authService";
import { markNotificationAsRead } from "../../services/doctorPortalService";
import {
  formatDateTime,
  getNotificationReferencePath,
  getStatusLabel,
} from "../../utils/doctorHelpers";
import { useNotifications } from "../../hooks/useNotifications";

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
  const currentYear = new Date().getFullYear();
  const [currentUser, setCurrentUser] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const { notifications, loading: notificationsLoading, markOneAsRead } = useNotifications();

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

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const popupNotifications = notifications.slice(0, 5);

  function handleLogout() {
    clearAccessToken();
    navigate("/login");
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        markOneAsRead(notification.id);
      }
    } catch {
      // Keep popup usable even if mark-as-read fails.
    } finally {
      setIsNotificationOpen(false);
    }

    const referencePath = getNotificationReferencePath(notification);
    navigate(referencePath || "/doctor/notifications");
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
              <div className="doctor-topbar__notification" ref={notificationRef}>
                <button
                  className="doctor-topbar__icon-button"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={isNotificationOpen}
                  onClick={() => setIsNotificationOpen((current) => !current)}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 ? (
                    <span className="doctor-topbar__notification-badge">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {isNotificationOpen ? (
                  <div className="doctor-notification-popup">
                    <div className="doctor-notification-popup__head">
                      <div>
                        <strong>Notifications</strong>
                        <span>
                          {unreadCount > 0
                            ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                            : "You are all caught up"}
                        </span>
                      </div>
                      <Link to="/doctor/notifications" onClick={() => setIsNotificationOpen(false)}>
                        View all
                      </Link>
                    </div>

                    <div className="doctor-notification-popup__list">
                      {notificationsLoading ? (
                        <p className="doctor-notification-popup__empty">Loading notifications...</p>
                      ) : popupNotifications.length === 0 ? (
                        <p className="doctor-notification-popup__empty">No notifications yet.</p>
                      ) : (
                        popupNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`doctor-notification-popup__item${
                              notification.isRead ? "" : " doctor-notification-popup__item--unread"
                            }`}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="doctor-notification-popup__item-head">
                              <strong>{notification.title}</strong>
                              <span>{getStatusLabel(notification.type)}</span>
                            </div>
                            <p>{notification.message}</p>
                            <small>{formatDateTime(notification.createdAt)}</small>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
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

          <footer className="site-footer">
            <div className="site-container footer-shell">
              <div className="footer-brand">
                <span className="footer-logo">MediCare</span>
                <div className="footer-contact">
                  <p>Doctor portal workspace for appointments, schedules, prescriptions, and follow-up care.</p>
                  <p>support@medicare.vn</p>
                  <p>1900 1234</p>
                </div>
              </div>

              <div className="footer-links">
                <NavLink to="/doctor/notifications">Notifications</NavLink>
                <NavLink to="/doctor/settings">Settings</NavLink>
                <NavLink to="/doctor/profile">Profile</NavLink>
                <a href="mailto:support@medicare.vn">Contact Support</a>
                <a href="/">Help Center</a>
              </div>
            </div>

            <div className="site-container footer-bottom">
              © {currentYear} MediCare. All rights reserved.
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
