import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPrescriptionById } from "../../../services/patientPortalService";
import {
  PatientPageShell,
  PatientStatusBadge,
  formatCurrency,
  formatDateTime,
} from "../portal/patientPortalUtils";

export function PatientPrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPrescriptionById(prescriptionId)
      .then((data) => {
        if (active) setPrescription(data);
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
  }, [prescriptionId]);

  return (
    <PatientPageShell
      eyebrow="Patient Portal / Prescription"
      title={prescription ? `Don thuoc #${prescription.id}` : "Chi tiet don thuoc"}
      description="Thong tin thuoc, lieu dung va huong dan su dung."
      actions={
        <>
          <Link className="mc-btn mc-btn--outline" to="/prescriptions">Danh sach don</Link>
          <button className="mc-btn mc-btn--primary" type="button" onClick={() => window.print()}>
            In don thuoc
          </button>
        </>
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai don thuoc...</p></div>
      ) : prescription ? (
        <article className="patient-panel patient-document">
          <div className="patient-panel__head">
            <div>
              <h2>Thong tin don thuoc</h2>
              <p>Tao luc {formatDateTime(prescription.createdAt)}</p>
            </div>
            <PatientStatusBadge status={prescription.status} />
          </div>

          <div className="patient-info-grid">
            <Info label="Bac si" value={prescription.doctorName} />
            <Info label="Benh nhan" value={prescription.patientName} />
            <Info label="Tong tien thuoc" value={formatCurrency(prescription.totalMedicineFee)} />
            <Info label="Ma ho so" value={`#${prescription.medicalRecordId}`} />
          </div>

          <div className="patient-note-box">
            <span>Ghi chu chung</span>
            <p>{prescription.generalNote || "Khong co ghi chu chung."}</p>
          </div>

          <div className="patient-table-wrap">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Thuoc</th>
                  <th>Lieu</th>
                  <th>So ngay</th>
                  <th>So luong</th>
                  <th>Thanh tien</th>
                  <th>Huong dan</th>
                </tr>
              </thead>
              <tbody>
                {(prescription.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.medicineName}</strong>
                      {item.note ? <small>{item.note}</small> : null}
                    </td>
                    <td>{item.dosePerTime} x {item.timesPerDay}/ngay</td>
                    <td>{item.durationDays}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.lineTotal)}</td>
                    <td>{item.instruction || item.dosageText || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        <div className="mc-state"><p>Khong tim thay don thuoc.</p></div>
      )}
    </PatientPageShell>
  );
}

function Info({ label, value }) {
  return (
    <div className="patient-info-item">
      <div>
        <small>{label}</small>
        <strong>{value || "--"}</strong>
      </div>
    </div>
  );
}
