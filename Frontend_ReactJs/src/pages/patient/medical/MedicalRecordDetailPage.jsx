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
      eyebrow="Patient Portal / Medical Record"
      title="Ho so benh an"
      description="Ket qua kham va huong dieu tri do bac si ghi nhan."
      actions={
        record ? (
          <Link className="mc-btn mc-btn--outline" to={`/my-appointments/${record.appointmentId}`}>
            Ve lich hen
          </Link>
        ) : null
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai ho so benh an...</p></div>
      ) : record ? (
        <div className="patient-detail-layout">
          <section className="patient-detail-main">
            <article className="patient-panel patient-document">
              <div className="patient-document__title">
                <span className="material-symbols-outlined">clinical_notes</span>
                <div>
                  <h2>Medical Record #{record.id}</h2>
                  <p>Tao luc {formatDateTime(record.createdAt)}</p>
                </div>
              </div>

              <div className="patient-info-grid">
                <InfoBlock label="Bac si" value={record.doctorName} />
                <InfoBlock label="Benh nhan" value={record.patientName} />
                <InfoBlock label="Ngay tai kham" value={formatDate(record.followUpDate)} />
                <InfoBlock label="Ma lich hen" value={`#${record.appointmentId}`} />
              </div>

              <MedicalSection title="Trieu chung" value={record.symptoms} />
              <MedicalSection title="Chan doan" value={record.diagnosis} />
              <MedicalSection title="Ke hoach dieu tri" value={record.treatmentPlan} />
              <MedicalSection title="Ghi chu" value={record.notes} />
            </article>
          </section>

          <aside className="patient-detail-side">
            <article className="patient-panel">
              <h2>Don thuoc</h2>
              <p className="patient-muted">
                Don thuoc se hien thi sau khi bac si tao tu ho so benh an nay.
              </p>
              {prescription ? (
                <Link className="mc-btn mc-btn--primary patient-full-btn" to={`/prescriptions/${prescription.id}`}>
                  Xem don thuoc
                </Link>
              ) : (
                <div className="patient-action-disabled">Chua co don thuoc.</div>
              )}
            </article>
          </aside>
        </div>
      ) : (
        <div className="mc-state"><p>Khong tim thay ho so benh an.</p></div>
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
      <p>{value || "Chua co thong tin."}</p>
    </section>
  );
}
