import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMedicalRecordById,
  getPrescriptionByMedicalRecordId,
} from "../../../services/patientPortalService";
import {
  PatientPageShell,
  formatDate,
  formatDateTime,
} from "../portal/patientPortalUtils";

export function PatientMedicalRecordDetailPage() {
  const { medicalRecordId } = useParams();
  const [record, setRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRecord() {
      try {
        const recordData = await getMedicalRecordById(medicalRecordId);
        let prescriptionData = null;
        try {
          prescriptionData = await getPrescriptionByMedicalRecordId(medicalRecordId);
        } catch {
          prescriptionData = null;
        }
        if (active) {
          setRecord(recordData);
          setPrescription(prescriptionData);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRecord();
    return () => {
      active = false;
    };
  }, [medicalRecordId]);

  return (
    <PatientPageShell
      eyebrow="Patient Portal / Hồ sơ bệnh án"
      title="Hồ sơ bệnh án chi tiết"
      description="Kết quả khám và hướng điều trị do bác sĩ ghi nhận."
      actions={
        record ? (
          <Link className="mc-btn mc-btn--outline" to={`/my-appointments/${record.appointmentId}`}>
            Về lịch hẹn
          </Link>
        ) : null
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Đang tải hồ sơ bệnh án...</p></div>
      ) : record ? (
        <div className="patient-detail-layout">
          <section className="patient-detail-main">
            <article className="patient-panel patient-document">
              <div className="patient-document__title">
                <span className="material-symbols-outlined">clinical_notes</span>
                <div>
                  <h2>Hồ sơ bệnh án #{record.id}</h2>
                  <p>Tạo lúc {formatDateTime(record.createdAt)}</p>
                </div>
              </div>

              <div className="patient-info-grid">
                <InfoBlock label="Bác sĩ" value={record.doctorName} />
                <InfoBlock label=" Bệnh nhân" value={record.patientName} />
                <InfoBlock label="Ngày tái khám" value={formatDate(record.followUpDate)} />
                <InfoBlock label="Mã lịch hẹn" value={`#${record.appointmentId}`} />
              </div>

              <MedicalSection title="Triệu chứng" value={record.symptoms} />
              <MedicalSection title="Chẩn đoán" value={record.diagnosis} />
              <MedicalSection title="Kế hoạch điều trị" value={record.treatmentPlan} />
              <MedicalSection title="Ghi chú" value={record.notes} />
            </article>
          </section>

          <aside className="patient-detail-side">
            <article className="patient-panel">
              <h2>Đơn thuốc</h2>
              <p className="patient-muted">
                Đơn thuốc sẽ hiển thị sau khi bác sĩ tạo từ hồ sơ bệnh án này.
              </p>
              {prescription ? (
                <Link className="mc-btn mc-btn--primary patient-full-btn" to={`/prescriptions/${prescription.id}`}>
                  Xem đơn thuốc
                </Link>
              ) : (
                <div className="patient-action-disabled">Chưa có đơn thuốc.</div>
              )}
            </article>
          </aside>
        </div>
      ) : (
        <div className="mc-state"><p>Không tìm thấy hồ sơ bệnh án.</p></div>
      )}
    </PatientPageShell>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="patient-info-item">
      <div>
        <small>{label}</small>
        <strong>{value || "--"}</strong>
      </div>
    </div>
  );
}

function MedicalSection({ title, value }) {
  return (
    <section className="patient-medical-section">
      <h3>{title}</h3>
      <p>{value || "Chưa có thông tin."}</p>
    </section>
  );
}
