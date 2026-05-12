import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getMedicalRecordById,
  getPrescriptionByMedicalRecordId,
} from "../../services/doctorPortalService";
import { formatCurrency, formatDate, formatDateTime } from "../../utils/doctorHelpers";

export function MedicalRecordDetailPage() {
  const { medicalRecordId } = useParams();
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMedicalRecord() {
      try {
        const medicalRecordData = await getMedicalRecordById(medicalRecordId);
        let prescriptionData = null;

        try {
          prescriptionData = await getPrescriptionByMedicalRecordId(medicalRecordId);
        } catch {
          prescriptionData = null;
        }

        if (!active) {
          return;
        }

        setMedicalRecord(medicalRecordData);
        setPrescription(prescriptionData);
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

    loadMedicalRecord();

    return () => {
      active = false;
    };
  }, [medicalRecordId]);

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignore clipboard errors for now.
    }
  }

  const treatmentSteps = String(medicalRecord?.treatmentPlan ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <DoctorWorkspace
      eyebrow={`Dashboard / Patients / ${medicalRecord?.patientName ?? "Record"} / Record #${medicalRecordId ?? ""}`}
      title={medicalRecord ? `Medical Record #${medicalRecord.id}` : "Medical record detail"}
      description={medicalRecord?.notes || "Review the medical record before continuing prescription and follow-up care."}
      actions={
        medicalRecord ? (
          <>
            <button className="button button--secondary" type="button" onClick={handlePrint}>
              Print
            </button>
            <button className="button button--secondary" type="button" onClick={handleShare}>
              Share
            </button>
            {prescription ? (
              <Link className="button button--primary" to={`/doctor/prescriptions/${prescription.id}`}>
                View Prescription
              </Link>
            ) : (
              <Link className="button button--primary" to={`/doctor/prescriptions/create/${medicalRecord.id}`}>
                Create Prescription
              </Link>
            )}
          </>
        ) : null
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Loading medical record...</p>
      ) : medicalRecord ? (
        <section className="doctor-record-layout">
          <div className="doctor-record-top">
            <article className="doctor-record-card doctor-record-card--summary">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--primary material-symbols-outlined">
                  person
                </span>
                <div>
                  <h2>Patient Summary</h2>
                  <p>Core patient and attending-doctor context.</p>
                </div>
              </div>

              <div className="doctor-record-summary-grid">
                <div>
                  <span>Full name</span>
                  <strong>{medicalRecord.patientName}</strong>
                </div>
                <div>
                  <span>Patient ID</span>
                  <strong>#{medicalRecord.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Appointment ID</span>
                  <strong>#{medicalRecord.appointmentId ?? "--"}</strong>
                </div>
                <div>
                  <span>Attending doctor</span>
                  <strong>{medicalRecord.doctorName}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-record-card doctor-record-card--symptoms">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--danger material-symbols-outlined">
                  ecg_heart
                </span>
                <div>
                  <h2>Symptoms & Findings</h2>
                  <p>Primary complaint and observed clinical concerns.</p>
                </div>
              </div>

              <div className="doctor-record-symptoms">
                <div>
                  <span>Chief complaint</span>
                  <p>{medicalRecord.symptoms}</p>
                </div>
                <div className="doctor-record-tags">
                  {String(medicalRecord.symptoms)
                    .split(/[,.]/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                </div>
              </div>
            </article>
          </div>

          <article className="doctor-record-card doctor-record-card--diagnosis">
            <div className="doctor-record-card__title doctor-record-card__title--between">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--primary material-symbols-outlined">
                  checklist
                </span>
                <div>
                  <h2>Diagnosis</h2>
                  <p>Final assessment from the consultation.</p>
                </div>
              </div>
              <span className="doctor-record-code">Record #{medicalRecord.id}</span>
            </div>

            <h3 className="doctor-record-diagnosis">{medicalRecord.diagnosis}</h3>
            <p className="doctor-record-diagnosis-note">
              {medicalRecord.notes || "No extra diagnostic note provided."}
            </p>
          </article>

          <div className="doctor-record-lower">
            <article className="doctor-record-card">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--success material-symbols-outlined">
                  medical_services
                </span>
                <div>
                  <h2>Treatment Plan</h2>
                  <p>Recommended care sequence and follow-up approach.</p>
                </div>
              </div>

              <div className="doctor-record-plan">
                {(treatmentSteps.length ? treatmentSteps : [medicalRecord.treatmentPlan]).map((step, index) => (
                  <div key={`${index + 1}-${step}`} className="doctor-record-plan__step">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>
                        {index === 0
                          ? "Primary intervention"
                          : index === 1
                            ? "Symptom support"
                            : `Plan step ${index + 1}`}
                      </strong>
                      <p>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <aside className="doctor-record-prescription">
              <div className="doctor-record-prescription__head">
                <span className="material-symbols-outlined">prescriptions</span>
                <div>
                  <h2>Active Prescription</h2>
                  <p>
                    {prescription
                      ? "Current medication instructions linked to this medical record."
                      : "No prescription has been created yet."}
                  </p>
                </div>
              </div>

              {prescription ? (
                <>
                  <div className="doctor-record-prescription__items">
                    {prescription.items?.slice(0, 4).map((item) => (
                      <div
                        key={item.id ?? `${item.medicineName}-${item.dosePerTime}`}
                        className="doctor-record-prescription__item"
                      >
                        <strong>{item.medicineName}</strong>
                        <span>
                          {item.dosePerTime} {item.unit || ""} • {item.timesPerDay}x daily •{" "}
                          {item.durationDays} days
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="doctor-record-prescription__footer">
                    <span>Total medicine fee</span>
                    <strong>{formatCurrency(prescription.totalMedicineFee)}</strong>
                  </div>
                </>
              ) : (
                <div className="doctor-record-prescription__empty">
                  <p>Create a prescription to attach medication guidance to this medical record.</p>
                  <Link className="button button--light" to={`/doctor/prescriptions/create/${medicalRecord.id}`}>
                    Create Prescription
                  </Link>
                </div>
              )}
            </aside>
          </div>

          <article className="doctor-record-footer">
            <div>
              <span>Follow-up date</span>
              <strong>{medicalRecord.followUpDate ? formatDate(medicalRecord.followUpDate) : "--"}</strong>
            </div>
            <div>
              <span>Record created</span>
              <strong>{formatDateTime(medicalRecord.createdAt)}</strong>
            </div>
            <div>
              <span>Doctor signature</span>
              <strong>{medicalRecord.doctorName}</strong>
            </div>
          </article>
        </section>
      ) : (
        <p className="empty-state">Medical record not found.</p>
      )}
    </DoctorWorkspace>
  );
}
