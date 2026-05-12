import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { getPrescriptionById } from "../../services/doctorPortalService";
import { formatCurrency, formatDateTime } from "../../utils/doctorHelpers";

export function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPrescription() {
      try {
        const data = await getPrescriptionById(prescriptionId);
        if (active) {
          setPrescription(data);
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

    loadPrescription();

    return () => {
      active = false;
    };
  }, [prescriptionId]);

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Prescription"
      title={prescription ? `Prescription ${prescription.id}` : "Prescription detail"}
      description="Rao soat don thuoc, huong dan dung thuoc va tong chi phi."
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Loading prescription...</p>
      ) : prescription ? (
        <section className="doctor-grid-two">
          <article className="doctor-panel">
            <div className="doctor-panel__head">
              <div>
                <h2>Prescription information</h2>
                <p>Thong tin tong quan cua don thuoc.</p>
              </div>
            </div>

            <dl className="doctor-detail-grid doctor-detail-grid--single">
              <div>
                <dt>Patient</dt>
                <dd>{prescription.patientName}</dd>
              </div>
              <div>
                <dt>Doctor</dt>
                <dd>{prescription.doctorName}</dd>
              </div>
              <div>
                <dt>Created at</dt>
                <dd>{formatDateTime(prescription.createdAt)}</dd>
              </div>
              <div>
                <dt>General note</dt>
                <dd>{prescription.generalNote || "--"}</dd>
              </div>
              <div>
                <dt>Total medicine fee</dt>
                <dd>{formatCurrency(prescription.totalMedicineFee)}</dd>
              </div>
            </dl>
          </article>

          <article className="doctor-panel doctor-panel--soft">
            <div className="doctor-panel__head">
              <div>
                <h2>Medicine items</h2>
                <p>Chi tiet lieu dung va huong dan.</p>
              </div>
            </div>

            <div className="doctor-list">
              {prescription.items?.map((item) => (
                <div className="doctor-list-item doctor-list-item--stack" key={item.id}>
                  <div>
                    <h3>{item.medicineName}</h3>
                    <p>
                      {item.dosePerTime} per time - {item.timesPerDay} times/day - {item.durationDays} days
                    </p>
                    <small>{item.instruction || item.dosageText || "--"}</small>
                  </div>
                  <small>
                    Quantity: {item.quantity} - Line total: {formatCurrency(item.lineTotal)}
                  </small>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : (
        <p className="empty-state">Prescription not found.</p>
      )}
    </DoctorWorkspace>
  );
}
