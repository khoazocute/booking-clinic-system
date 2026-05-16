import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../../services/patientPortalService";
import {
  EmptyState,
  PatientPageShell,
  PatientStatusBadge,
  formatDateTime,
} from "../portal/patientPortalUtils";

function getReferencePath(notification) {
  if (notification.referenceType === "APPOINTMENT") {
    return `/my-appointments/${notification.referenceId}`;
  }
  if (notification.referenceType === "PRESCRIPTION") {
    return `/prescriptions/${notification.referenceId}`;
  }
  return null;
}

export function MyNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyNotifications()
      .then((items) => {
        if (active) setNotifications(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleMarkOne(id) {
    try {
      setUpdating(true);
      const updated = await markNotificationAsRead(id);
      setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
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
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <PatientPageShell
      eyebrow="Patient Portal"
      title="Thong bao"
      description="Cap nhat tu lich hen, don thuoc va thanh toan."
      actions={
        <button className="mc-btn mc-btn--outline" disabled={updating || notifications.length === 0} type="button" onClick={handleMarkAll}>
          Danh dau da doc
        </button>
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai thong bao...</p></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications" title="Chua co thong bao" />
      ) : (
        <div className="patient-card-list">
          {notifications.map((notification) => {
            const referencePath = getReferencePath(notification);
            return (
              <article
                className={`patient-notification-card${notification.isRead ? "" : " patient-notification-card--unread"}`}
                key={notification.id}
              >
                <div>
                  <div className="patient-row-title">
                    <h2>{notification.title}</h2>
                    <PatientStatusBadge status={notification.type} />
                  </div>
                  <p>{notification.message}</p>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </div>
                <div className="patient-card-actions">
                  {referencePath ? (
                    <Link className="mc-btn mc-btn--primary" to={referencePath}>
                      Mo lien quan
                    </Link>
                  ) : null}
                  {!notification.isRead ? (
                    <button className="mc-btn mc-btn--outline" disabled={updating} type="button" onClick={() => handleMarkOne(notification.id)}>
                      Da doc
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PatientPageShell>
  );
}
