import { useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/doctorPortalService";
import { formatDateTime, getNotificationReferencePath } from "../../utils/doctorHelpers";
import { useNotifications } from "../../hooks/useNotifications";

export function DoctorNotificationsPage() {
  const { notifications, loading, markOneAsRead, markAllRead } = useNotifications();
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  async function handleMarkOne(id) {
    try {
      setUpdating(true);
      await markNotificationAsRead(id);
      markOneAsRead(id);
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
      markAllRead();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Thông báo"
      title="Thông báo bác sĩ"
      description="Theo dõi thông báo từ backend và mở màn hình liên quan."
      actions={
        <button
          className="button button--secondary"
          disabled={updating || notifications.length === 0}
          type="button"
          onClick={handleMarkAll}
        >
          Đánh dấu tất cả đã đọc
        </button>
      }
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {loading ? (
          <p className="empty-state">Đang tải thông báo...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-state">Chưa có thông báo nào.</p>
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
                          Mở liên quan
                        </Link>
                      ) : null}
                      {!notification.isRead ? (
                        <button
                          className="doctor-text-button"
                          disabled={updating}
                          type="button"
                          onClick={() => handleMarkOne(notification.id)}
                        >
                          Đánh dấu đã đọc
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
