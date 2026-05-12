import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getAppointmentById,
  getMedicalRecordByAppointmentId,
  getPrescriptionByMedicalRecordId,
  updateAppointmentStatus,
} from "../../services/doctorPortalService";
import { formatDate, formatTime } from "../../utils/doctorHelpers";

export function DoctorAppointmentDetailPage() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAppointmentDetail() {
      try {
        const appointmentData = await getAppointmentById(appointmentId);
        let medicalRecordData = null;
        let prescriptionData = null;

        try {
          medicalRecordData = await getMedicalRecordByAppointmentId(appointmentId);
        } catch {
          medicalRecordData = null;
        }

        if (medicalRecordData?.id) {
          try {
            prescriptionData = await getPrescriptionByMedicalRecordId(medicalRecordData.id);
          } catch {
            prescriptionData = null;
          }
        }

        if (!active) {
          return;
        }

        setAppointment(appointmentData);
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

    loadAppointmentDetail();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  async function handleStatusUpdate(status) {
    if (!appointmentId) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      const updated = await updateAppointmentStatus(appointmentId, {
        status,
        cancelReason: status === "CANCELLED" ? "Cancelled by doctor from dashboard." : null,
      });
      setAppointment(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  const canConfirm =
    appointment && !updating && !["CONFIRMED", "COMPLETED", "CANCELLED"].includes(appointment.status);
  const canCancel = appointment && !updating && appointment.status !== "CANCELLED";

  return (
    <DoctorWorkspace
      eyebrow={`Dashboard / Appointments / ${appointment ? `Appointment #${appointment.id}` : "Detail"}`}
      title={appointment ? `Appointment ${appointment.id}` : "Appointment detail"}
      description="Review appointment details and patient context before continuing the clinical workflow."
      actions={
        <>
          <button
            className="button button--secondary"
            disabled={!canCancel}
            type="button"
            onClick={() => handleStatusUpdate("CANCELLED")}
          >
            Cancel
          </button>
          <button
            className="button button--primary"
            disabled={!canConfirm}
            type="button"
            onClick={() => handleStatusUpdate("CONFIRMED")}
          >
            {updating ? "Updating..." : "Confirm"}
          </button>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Loading appointment detail...</p>
      ) : appointment ? (
        <section className="doctor-case-layout">
          <div className="doctor-case-main">
            <article className="doctor-case-card doctor-case-card--patient">
              <div className="doctor-case-card__head">
                <div className="doctor-case-card__title">
                  <span className="doctor-case-card__icon doctor-case-card__icon--primary material-symbols-outlined">
                    person
                  </span>
                  <div>
                    <h2>Patient Information</h2>
                    <p>Prepare for consultation with the latest appointment context.</p>
                  </div>
                </div>
                <div className="doctor-case-card__inline">
                  <DoctorStatusBadge status={appointment.status} />
                </div>
              </div>

              <div className="doctor-case-info-grid">
                <div>
                  <span>Patient name</span>
                  <strong>{appointment.patientName}</strong>
                </div>
                <div>
                  <span>Patient ID</span>
                  <strong>#{appointment.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Attending doctor</span>
                  <strong>{appointment.doctorName || "--"}</strong>
                </div>
                <div>
                  <span>Schedule ID</span>
                  <strong>#{appointment.scheduleId ?? "--"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-case-card">
              <div className="doctor-case-card__title">
                <span className="doctor-case-card__icon material-symbols-outlined">
                  calendar_month
                </span>
                <div>
                  <h2>Appointment Details</h2>
                  <p>Review timing, reason for visit, and notes before proceeding.</p>
                </div>
              </div>

              <div className="doctor-case-info-grid">
                <div>
                  <span>Date</span>
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </strong>
                </div>
              </div>

              <div className="doctor-case-highlight">
                <span>Reason for visit</span>
                <p>{appointment.reason || "--"}</p>
              </div>

              <div className="doctor-case-note">
                <span>Notes</span>
                <p>
                  {appointment.cancelReason
                    ? appointment.cancelReason
                    : "No extra scheduling notes have been attached to this appointment yet."}
                </p>
              </div>
            </article>
          </div>

          <aside className="doctor-case-side">
            <article className="doctor-case-card doctor-case-card--accent">
              <div className="doctor-case-card__title">
                <span className="doctor-case-card__icon doctor-case-card__icon--primary material-symbols-outlined">
                  bolt
                </span>
                <div>
                  <h2>Next actions</h2>
                  <p>Continue the clinical workflow from this appointment.</p>
                </div>
              </div>

              <div className="doctor-case-action-stack">
                {medicalRecord ? (
                  <Link
                    className="doctor-case-action doctor-case-action--primary"
                    to={`/doctor/medical-records/${medicalRecord.id}`}
                  >
                    <span className="material-symbols-outlined">description</span>
                    <span>View Medical Record</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : (
                  <Link
                    className="doctor-case-action doctor-case-action--primary"
                    to={`/doctor/medical-records/create/${appointment.id}`}
                  >
                    <span className="material-symbols-outlined">note_add</span>
                    <span>Create Medical Record</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                )}

                {prescription ? (
                  <Link
                    className="doctor-case-action"
                    to={`/doctor/prescriptions/${prescription.id}`}
                  >
                    <span className="material-symbols-outlined">medication</span>
                    <span>View Prescription</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : medicalRecord ? (
                  <Link
                    className="doctor-case-action"
                    to={`/doctor/prescriptions/create/${medicalRecord.id}`}
                  >
                    <span className="material-symbols-outlined">medication</span>
                    <span>Create Prescription</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : (
                  <div className="doctor-case-action doctor-case-action--disabled">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Prescription unlocks after medical record</span>
                  </div>
                )}
              </div>

              <div className="doctor-case-links">
                <Link
                  className="doctor-case-link-card"
                  to={medicalRecord ? `/doctor/medical-records/${medicalRecord.id}` : `/doctor/appointments`}
                >
                  <span className="material-symbols-outlined">history</span>
                  <strong>{medicalRecord ? "View History" : "Return to queue"}</strong>
                </Link>
                <Link
                  className="doctor-case-link-card"
                  to={prescription ? `/doctor/prescriptions/${prescription.id}` : "/doctor/schedules"}
                >
                  <span className="material-symbols-outlined">lab_profile</span>
                  <strong>{prescription ? "Prescription detail" : "Open schedules"}</strong>
                </Link>
              </div>
            </article>

            <article className="doctor-case-promo">
              <div className="doctor-case-promo__overlay" />
              <p>Providing clarity through data-driven clinical management.</p>
            </article>
          </aside>
        </section>
      ) : (
        <p className="empty-state">Appointment not found.</p>
      )}
    </DoctorWorkspace>
  );
}
