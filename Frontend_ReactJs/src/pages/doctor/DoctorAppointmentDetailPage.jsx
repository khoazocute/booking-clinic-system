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
        cancelReason: status === "CANCELLED" ? "Bác sĩ đã hủy lịch từ trang quản lý." : null,
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
      eyebrow={`Tổng quan / Lịch hẹn / ${appointment ? `Lịch hẹn #${appointment.id}` : "Chi tiết"}`}
      title={appointment ? `Lịch hẹn ${appointment.id}` : "Chi tiết lịch hẹn"}
      description="Kiểm tra thông tin lịch hẹn và bối cảnh bệnh nhân trước khi tiếp tục quy trình khám."
      actions={
        <>
          <button
            className="button button--secondary"
            disabled={!canCancel}
            type="button"
            onClick={() => handleStatusUpdate("CANCELLED")}
          >
            Hủy lịch
          </button>
          <button
            className="button button--primary"
            disabled={!canConfirm}
            type="button"
            onClick={() => handleStatusUpdate("CONFIRMED")}
          >
            {updating ? "Đang cập nhật..." : "Xác nhận"}
          </button>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Đang tải chi tiết lịch hẹn...</p>
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
                    <h2>Thông tin bệnh nhân</h2>
                    <p>Chuẩn bị buổi khám với thông tin lịch hẹn mới nhất.</p>
                  </div>
                </div>
                <div className="doctor-case-card__inline">
                  <DoctorStatusBadge status={appointment.status} />
                </div>
              </div>

              <div className="doctor-case-info-grid">
                <div>
                  <span>Tên bệnh nhân</span>
                  <strong>{appointment.patientName}</strong>
                </div>
                <div>
                  <span>Mã bệnh nhân</span>
                  <strong>#{appointment.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Bác sĩ phụ trách</span>
                  <strong>{appointment.doctorName || "--"}</strong>
                </div>
                <div>
                  <span>Mã lịch làm việc</span>
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
                  <h2>Chi tiết lịch hẹn</h2>
                  <p>Kiểm tra thời gian, lý do khám và ghi chú trước khi xử lý.</p>
                </div>
              </div>

              <div className="doctor-case-info-grid">
                <div>
                  <span>Ngày khám</span>
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                </div>
                <div>
                  <span>Giờ khám</span>
                  <strong>
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </strong>
                </div>
              </div>

              <div className="doctor-case-highlight">
                <span>Lý do khám</span>
                <p>{appointment.reason || "--"}</p>
              </div>

              <div className="doctor-case-note">
                <span>Ghi chú</span>
                <p>
                  {appointment.cancelReason
                    ? appointment.cancelReason
                    : "Chưa có ghi chú bổ sung cho lịch hẹn này."}
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
                  <h2>Thao tác tiếp theo</h2>
                  <p>Tiếp tục quy trình khám từ lịch hẹn này.</p>
                </div>
              </div>

              <div className="doctor-case-action-stack">
                {medicalRecord ? (
                  <Link
                    className="doctor-case-action doctor-case-action--primary"
                    to={`/doctor/medical-records/${medicalRecord.id}`}
                  >
                    <span className="material-symbols-outlined">description</span>
                    <span>Xem hồ sơ bệnh án</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : appointment.status === "CONFIRMED" ? (
                  <Link
                    className="doctor-case-action doctor-case-action--primary"
                    to={`/doctor/medical-records/create/${appointment.id}`}
                  >
                    <span className="material-symbols-outlined">note_add</span>
                    <span>Tạo hồ sơ bệnh án</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : (
                  <div className="doctor-case-action doctor-case-action--disabled">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Cần xác nhận lịch hẹn trước khi tạo bệnh án</span>
                  </div>
                )}

                {prescription ? (
                  <Link
                    className="doctor-case-action"
                    to={`/doctor/prescriptions/${prescription.id}`}
                  >
                    <span className="material-symbols-outlined">medication</span>
                    <span>Xem đơn thuốc</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : medicalRecord ? (
                  <Link
                    className="doctor-case-action"
                    to={`/doctor/prescriptions/create/${medicalRecord.id}`}
                  >
                    <span className="material-symbols-outlined">medication</span>
                    <span>Tạo đơn thuốc</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                ) : (
                  <div className="doctor-case-action doctor-case-action--disabled">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Cần tạo hồ sơ bệnh án trước khi kê đơn</span>
                  </div>
                )}
              </div>

              <div className="doctor-case-links">
                <Link
                  className="doctor-case-link-card"
                  to={medicalRecord ? `/doctor/medical-records/${medicalRecord.id}` : `/doctor/appointments`}
                >
                  <span className="material-symbols-outlined">history</span>
                  <strong>{medicalRecord ? "Xem lịch sử" : "Quay lại danh sách"}</strong>
                </Link>
                <Link
                  className="doctor-case-link-card"
                  to={prescription ? `/doctor/prescriptions/${prescription.id}` : "/doctor/schedules"}
                >
                  <span className="material-symbols-outlined">lab_profile</span>
                  <strong>{prescription ? "Chi tiết đơn thuốc" : "Mở lịch làm việc"}</strong>
                </Link>
              </div>
            </article>

            <article className="doctor-case-promo">
              <div className="doctor-case-promo__overlay" />
              <p>Quản lý khám chữa bệnh rõ ràng hơn bằng dữ liệu.</p>
            </article>
          </aside>
        </section>
      ) : (
        <p className="empty-state">Không tìm thấy lịch hẹn.</p>
      )}
    </DoctorWorkspace>
  );
}
