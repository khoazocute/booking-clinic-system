import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPrescriptionSummaries } from "../../../services/patientPortalService";
import {
  EmptyState,
  PatientPageShell,
  PatientStatusBadge,
  formatCurrency,
  formatDateTime,
} from "../portal/patientPortalUtils";

export function MyPrescriptionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyPrescriptionSummaries()
      .then((data) => {
        if (active) setItems(data);
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

  return (
    <PatientPageShell
      eyebrow="Patient Portal"
      title="Đơn thuốc của tôi"
      description="Tổng hợp đơn thuốc từ các lịch khám đã hoàn thành."
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Đang tải đơn thuốc...</p></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="medication"
          title="Chưa có đơn thuốc"
          description="Đơn thuốc sẽ hiển thị sau khi bác sĩ hoàn tất hồ sơ bệnh án và kê đơn."
        />
      ) : (
        <div className="patient-card-list">
          {items.map(({ appointment, prescription }) => (
            <article className="patient-appointment-card" key={prescription.id}>
              <div className="patient-appointment-card__main">
                <div className="patient-avatar-token">
                  <span className="material-symbols-outlined">medication</span>
                </div>
                <div>
                  <div className="patient-row-title">
                    <h2>Đơn thuốc #{prescription.id}</h2>
                    <PatientStatusBadge status={prescription.status} />
                  </div>
                  <p>Bác sĩ {prescription.doctorName ?? appointment.doctorName}</p>
                  <div className="patient-meta-row">
                    <span>{formatDateTime(prescription.createdAt)}</span>
                    <span>{prescription.items?.length ?? 0} loại thuốc</span>
                    <span>{formatCurrency(prescription.totalMedicineFee)}</span>
                  </div>
                </div>
              </div>
              <div className="patient-card-actions">
                <Link className="mc-btn mc-btn--primary" to={`/prescriptions/${prescription.id}`}>
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
