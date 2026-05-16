import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelAppointment,
  getAppointmentById,
  getMedicalRecordByAppointmentId,
  getPrescriptionByMedicalRecordId,
} from "../../../services/patientPortalService";
import {
  PatientPageShell,
  PatientStatusBadge,
  formatDate,
  formatTime,
} from "../portal/patientPortalUtils";

export function AppointmentDetailPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      try {
        const appointmentData = (await getAppointmentById(appointmentId))?.data ?? null;
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

        if (active) {
          setAppointment(appointmentData);
          setMedicalRecord(medicalRecordData);
          setPrescription(prescriptionData);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      active = false;
    };
  }, [appointmentId]);

  async function handleCancel() {
    const approved = window.confirm("Ban co chac muon huy lich hen nay?");
    if (!approved) return;

    try {
      setUpdating(true);
      setError("");
      await cancelAppointment(appointmentId);
      const refreshed = await getAppointmentById(appointmentId);
      setAppointment(refreshed?.data ?? null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(false);
    }
  }

  const canCancel = appointment && ["PENDING", "CONFIRMED"].includes(appointment.status);

  return (
    <PatientPageShell
      eyebrow="Patient Portal / Appointment"
      title={appointment ? `Lich hen #${appointment.id}` : "Chi tiet lich hen"}
      description="Kiem tra thong tin lich kham va tiep tuc cac buoc sau khi kham."
      actions={
        <Link className="mc-btn mc-btn--outline" to="/my-appointments">
          Quay lai
        </Link>
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai chi tiet lich hen...</p></div>
      ) : appointment ? (
        <div className="patient-detail-layout">
          <section className="patient-detail-main">
            <article className="patient-panel">
              <div className="patient-panel__head">
                <div>
                  <h2>Thong tin lich kham</h2>
                  <p>Trang thai hien tai va noi dung dat lich cua ban.</p>
                </div>
                <PatientStatusBadge status={appointment.status} />
              </div>

              <div className="patient-info-grid">
                <InfoItem label="Bac si" value={appointment.doctorName} icon="stethoscope" />
                <InfoItem label="Benh nhan" value={appointment.patientName} icon="person" />
                <InfoItem label="Ngay kham" value={formatDate(appointment.appointmentDate)} icon="calendar_today" />
                <InfoItem label="Gio kham" value={`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`} icon="schedule" />
              </div>

              <div className="patient-note-box">
                <span>Ly do kham</span>
                <p>{appointment.reason || "Chua co ly do kham."}</p>
              </div>

              {appointment.cancelReason ? (
                <div className="patient-note-box patient-note-box--danger">
                  <span>Ly do huy</span>
                  <p>{appointment.cancelReason}</p>
                </div>
              ) : null}
            </article>
          </section>

          <aside className="patient-detail-side">
            <article className="patient-panel">
              <div className="patient-panel__head">
                <div>
                  <h2>Buoc tiep theo</h2>
                  <p>Thao tac phu hop voi trang thai lich hen.</p>
                </div>
              </div>

              <div className="patient-action-stack">
                {canCancel ? (
                  <button className="mc-btn mc-btn--outline" disabled={updating} type="button" onClick={handleCancel}>
                    {updating ? "Dang huy..." : "Huy lich hen"}
                  </button>
                ) : null}

                {medicalRecord ? (
                  <Link className="mc-btn mc-btn--primary" to={`/medical-records/${medicalRecord.id}`}>
                    Xem ho so benh an
                  </Link>
                ) : (
                  <div className="patient-action-disabled">Ho so benh an se co sau khi bac si hoan tat buoi kham.</div>
                )}

                {prescription ? (
                  <Link className="mc-btn mc-btn--primary" to={`/prescriptions/${prescription.id}`}>
                    Xem don thuoc
                  </Link>
                ) : null}

                {appointment.status === "COMPLETED" ? (
                  <Link className="mc-btn mc-btn--outline" to={`/reviews/create/${appointment.id}`}>
                    Viet danh gia
                  </Link>
                ) : null}

                <button className="mc-btn mc-btn--outline" type="button" onClick={() => navigate(`/booking?doctorId=${appointment.doctorId}`)}>
                  Dat lich lai voi bac si
                </button>
              </div>
            </article>
          </aside>
        </div>
      ) : (
        <div className="mc-state"><p>Khong tim thay lich hen.</p></div>
      )}
    </PatientPageShell>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="patient-info-item">
      <span className="material-symbols-outlined">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value || "--"}</strong>
      </div>
    </div>
  );
}
