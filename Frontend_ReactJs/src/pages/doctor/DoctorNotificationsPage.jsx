import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getDoctorNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/doctorPortalService";
import { formatDateTime, getNotificationReferencePath } from "../../utils/doctorHelpers";

export function DoctorNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const items = await getDoctorNotifications();
        if (active) {
          setNotifications(items);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  async function handleMarkOne(id) {
    try {
      setUpdating(true);
      const updated = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkAll() {
    try {
      setUpdating(true);
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Notifications"
      title="Doctor notifications"
      description="Theo doi notification that tu backend va di toi man hinh lien quan."
      actions={
        <button
          className="button button--secondary"
          disabled={updating || notifications.length === 0}
          type="button"
          onClick={handleMarkAll}
        >
          Mark all as read
        </button>
      }
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {loading ? (
          <p className="empty-state">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-state">No notifications available.</p>
        ) : (
          <div className="doctor-list">
            {notifications.map((notification) => {
              const referencePath = getNotificationReferencePath(notification);
              return (
                <div
                  className={`doctor-list-item doctor-list-item--stack${
                    notification.isRead ? "" : " doctor-list-item--unread"
                  }`}
                  key={notification.id}
                >
                  <div className="doctor-review-head">
                    <h3>{notification.title}</h3>
                    <DoctorStatusBadge status={notification.type} />
                  </div>
                  <p>{notification.message}</p>
                  <div className="doctor-list-item__meta-row">
                    <small>{formatDateTime(notification.createdAt)}</small>
                    <div className="doctor-action-stack">
                      {referencePath ? (
                        <Link className="doctor-text-link" to={referencePath}>
                          Open related
                        </Link>
                      ) : null}
                      {!notification.isRead ? (
                        <button
                          className="doctor-text-button"
                          disabled={updating}
                          type="button"
                          onClick={() => handleMarkOne(notification.id)}
                        >
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </DoctorWorkspace>
  );
}
