import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAccessToken, getCurrentUser } from "../../services/authService";
import { markNotificationAsRead } from "../../services/doctorPortalService";
import {
  formatDateTime,
  getNotificationReferencePath,
  getStatusLabel,
} from "../../utils/doctorHelpers";
import { useNotifications } from "../../hooks/useNotifications";

const doctorNavItems = [
  { to: "/doctor", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/doctor/appointments", label: "Lich hen", icon: "calendar_month" },
  { to: "/doctor/schedules", label: "Lich lam viec", icon: "event_available" },
  { to: "/doctor/medical-records", label: "Ho so kham", icon: "clinical_notes" },
  { to: "/doctor/profile", label: "Ho so", icon: "badge" },
  { to: "/doctor/reviews", label: "Danh gia", icon: "star" },
  { to: "/doctor/settings", label: "Cai dat", icon: "settings" },
];

function getInitials(name) {
  if (!name) return "DR";

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DoctorWorkspace({ eyebrow, title, description, actions, children }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const { notifications, loading: notificationsLoading, markOneAsRead } = useNotifications();

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((response) => {
        if (active) setCurrentUser(response?.data ?? null);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      });

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
      if (event.key === "Escape") setIsNotificationOpen(false);
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
      // Keep navigation usable even when the read update fails.
    } finally {
      setIsNotificationOpen(false);
    }

    navigate(getNotificationReferencePath(notification) || "/doctor/notifications");
  }

  return (
    <div className="admin-portal doctor-portal">
      <div className="admin-shell doctor-shell doctor-shell--portal">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__logo">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div>
              <strong className="admin-sidebar__brand-title">MedClarity</strong>
              <span className="admin-sidebar__brand-sub">Doctor Portal</span>
            </div>
          </div>

          <nav className="admin-sidebar__nav" aria-label="Doctor navigation">
            {doctorNavItems.map((item) => (
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
            <span>Dang xuat</span>
          </button>
        </aside>

        <section className="admin-main">
          <header className="admin-topbar">
            <label className="admin-topbar__search" aria-label="Tim kiem">
              <span className="material-symbols-outlined">search</span>
              <input type="search" placeholder="Tim benh nhan, lich hen..." />
            </label>

            <div className="admin-topbar__actions">
              <div className="doctor-topbar__notification" ref={notificationRef}>
                <button
                  className="admin-topbar__icon-btn doctor-topbar__icon-button"
                  type="button"
                  aria-label="Thong bao"
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
                        <strong>Thong bao</strong>
                        <span>{unreadCount > 0 ? `${unreadCount} thong bao moi` : "Da doc het"}</span>
                      </div>
                      <Link to="/doctor/notifications" onClick={() => setIsNotificationOpen(false)}>
                        Xem tat ca
                      </Link>
                    </div>

                    <div className="doctor-notification-popup__list">
                      {notificationsLoading ? (
                        <p className="doctor-notification-popup__empty">Dang tai thong bao...</p>
                      ) : popupNotifications.length === 0 ? (
                        <p className="doctor-notification-popup__empty">Chua co thong bao.</p>
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

              <NavLink className="admin-topbar__icon-btn" to="/doctor/settings" aria-label="Cai dat">
                <span className="material-symbols-outlined">settings</span>
              </NavLink>

              <NavLink className="admin-topbar__profile doctor-topbar__profile" to="/doctor/profile">
                <div className="admin-topbar__avatar">{getInitials(currentUser?.fullName ?? currentUser?.email)}</div>
                <div>
                  <strong>{currentUser?.fullName ?? "Bac si"}</strong>
                  <span>{currentUser?.email ?? ""}</span>
                </div>
              </NavLink>
            </div>
          </header>

          <header className="admin-page-header">
            <div>
              {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
              <h1>{title}</h1>
              {description ? <p className="admin-page-header__desc">{description}</p> : null}
            </div>
            {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
          </header>

          <div className="admin-page-body doctor-page-body">{children}</div>
        </section>
      </div>
    </div>
  );
}
