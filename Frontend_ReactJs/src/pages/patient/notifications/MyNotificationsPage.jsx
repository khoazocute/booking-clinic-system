import { useState } from "react";
import { Link } from "react-router-dom";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../../services/patientPortalService";
import { useNotifications } from "../../../hooks/useNotifications";
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

const NOTIFICATION_TEXT_MAP = {
  "Dat lich thanh cong": "Đặt lịch thành công",
  "Thanh toan don thuoc thanh cong": "Thanh toán đơn thuốc thành công",
  "Don thuoc da duoc tao": "Đơn thuốc đã được tạo",
  "Thanh toan thanh cong": "Thanh toán thành công",
  "Ban da dat lich kham thanh cong voi bac si": "Bạn đã đặt lịch khám thành công với bác sĩ",
  "Khoan thanh toan don thuoc cua ban da duoc xac nhan": "Khoản thanh toán đơn thuốc của bạn đã được xác nhận",
  "Bac si da tao don thuoc cho lich kham cua ban": "Bác sĩ đã tạo đơn thuốc cho lịch khám của bạn",
  "Khoan thanh toan dat lich cua ban da duoc xac nhan": "Khoản thanh toán đặt lịch của bạn đã được xác nhận",
};

function normalizeVietnameseText(value) {
  if (!value) return value;
  return Object.entries(NOTIFICATION_TEXT_MAP).reduce(
    (text, [from, to]) => text.replaceAll(from, to),
    String(value),
  );
}

export function MyNotificationsPage() {
  const { notifications, loading, markOneAsRead, markAllRead } = useNotifications();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

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
    <PatientPageShell
      eyebrow="Patient Portal"
      title="Thông báo của tôi"
      description="Cập nhật từ lịch hẹn, đơn thuốc và thanh toán."
      actions={
        <button className="mc-btn mc-btn--outline" disabled={updating || notifications.length === 0} type="button" onClick={handleMarkAll}>
          Đánh dấu đã đọc
        </button>
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Đang tải thông báo...</p></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications" title="Chưa có thông báo" />
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
                    <h2>{normalizeVietnameseText(notification.title)}</h2>
                    <PatientStatusBadge status={notification.type} />
                  </div>
                  <p>{normalizeVietnameseText(notification.message)}</p>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </div>
                <div className="patient-card-actions">
                  {referencePath ? (
                    <Link className="mc-btn mc-btn--primary" to={referencePath}>
                      Mở liên quan
                    </Link>
                  ) : null}
                  {!notification.isRead ? (
                    <button className="mc-btn mc-btn--outline" disabled={updating} type="button" onClick={() => handleMarkOne(notification.id)}>
                      Đã đọc
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
