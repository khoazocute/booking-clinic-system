import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelAppointment,
  getAppointmentById,
  getMedicalRecordByAppointmentId,
  getPrescriptionByMedicalRecordId,
} from "../../../services/patientPortalService";
import { getPaymentByAppointmentId } from "../../../services/paymentService";
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
  const [rxPayStatus, setRxPayStatus] = useState(null); // null|UNPAID|PENDING|PAID
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

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

        // Load prescription payment status
        let rxPay = null;
        if (prescriptionData && appointmentData?.id) {
          try {
            const payRes = await getPaymentByAppointmentId(appointmentData.id);
            const list = payRes?.data ?? payRes ?? [];
            const arr = Array.isArray(list) ? list : [list];
            const rxRec = arr.find((p) => p.paymentType === "PRESCRIPTION");
            rxPay = rxRec ? rxRec.status : "UNPAID";
          } catch {
            rxPay = "UNPAID";
          }
        }

        if (active) {
          setAppointment(appointmentData);
          setMedicalRecord(medicalRecordData);
          setPrescription(prescriptionData);
          setRxPayStatus(rxPay);
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

  function getRefundPreview(appt) {
    if (!appt?.appointmentDate || !appt?.startTime) return null;
    const dt = new Date(`${appt.appointmentDate}T${appt.startTime}`);
    const hours = (dt - Date.now()) / 3600000;
    if (hours > 24) return { percent: 100, color: "#16a34a" };
    if (hours >= 6)  return { percent: 40,  color: "#d97706" };
    return { percent: 0, color: "#dc2626" };
  }

  async function confirmCancel() {
    try {
      setUpdating(true);
      setError("");
      const res = await cancelAppointment(appointmentId);
      const result = res?.data ?? res;
      setCancelResult(result);
      setShowCancelModal(false);
      const refreshed = await getAppointmentById(appointmentId);
      setAppointment(refreshed?.data ?? null);
    } catch (requestError) {
      setError(requestError.message);
      setShowCancelModal(false);
    } finally {
      setUpdating(false);
    }
  }

  const canCancel = appointment && ["PENDING", "CONFIRMED"].includes(appointment.status) && !cancelResult;

  return (
    <>
    <PatientPageShell
      eyebrow="Patient Portal / Lịch hẹn"
      title={appointment ? `Lịch hẹn #${appointment.id}` : "Chi tiết lịch hẹn"}
      description="Kiểm tra thông tin lịch khám và tiếp tục các bước sau khi khám."
      actions={
        <Link className="mc-btn mc-btn--outline" to="/my-appointments">
          Quay lại
        </Link>
      }
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Đang tải chi tiết lịch hẹn...</p></div>
      ) : appointment ? (
        <div className="patient-detail-layout">
          <section className="patient-detail-main">
            <article className="patient-panel">
              <div className="patient-panel__head">
                <div>
                  <h2>Thông tin lịch khám</h2>
                  <p>Trạng thái hiện tại và nội dung đặt lịch của bạn.</p>
                </div>
                <PatientStatusBadge status={appointment.status} />
              </div>

              <div className="patient-info-grid">
                <InfoItem label="Bác sĩ" value={appointment.doctorName} icon="stethoscope" />
                <InfoItem label="Bệnh nhân" value={appointment.patientName} icon="person" />
                <InfoItem label="Ngày khám" value={formatDate(appointment.appointmentDate)} icon="calendar_today" />
                <InfoItem label="Giờ khám" value={`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`} icon="schedule" />
              </div>

              <div className="patient-note-box">
                <span>Lý do khám</span>
                <p>{appointment.reason || "Chưa có lý do khám."}</p>
              </div>

              {appointment.cancelReason ? (
                <div className="patient-note-box patient-note-box--danger">
                  <span>Lý do hủy</span>
                  <p>{appointment.cancelReason}</p>
                </div>
              ) : null}
            </article>
          </section>

          <aside className="patient-detail-side">
            <article className="patient-panel">
              <div className="patient-panel__head">
                <div>
                  <h2>Bước tiếp theo</h2>
                  <p>Thao tác phù hợp với trạng thái lịch hẹn.</p>
                </div>
              </div>

              <div className="patient-action-stack">
                {cancelResult ? (
                  <div style={{ padding: "12px 16px", borderRadius: "10px", background: cancelResult.refundAmount > 0 ? "rgba(22,163,74,0.08)" : "rgba(107,114,128,0.08)", border: `1.5px solid ${cancelResult.refundAmount > 0 ? "rgba(22,163,74,0.3)" : "rgba(107,114,128,0.2)"}`, fontSize: "13px" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: cancelResult.refundAmount > 0 ? "#16a34a" : "#6b7280" }}>
                      {cancelResult.refundAmount > 0 ? "✓ Đã hủy — Hoàn tiền thành công" : "✓ Đã hủy lịch hẹn"}
                    </p>
                    {cancelResult.refundAmount > 0 && (
                      <>
                        <p style={{ margin: "0 0 2px", color: "#374151" }}>Hoàn: <strong>{Number(cancelResult.refundAmount).toLocaleString("vi-VN")} ₫</strong> ({cancelResult.refundPercent}%)</p>
                        <p style={{ margin: 0, color: "#374151" }}>Số dư ví: <strong>{Number(cancelResult.newWalletBalance).toLocaleString("vi-VN")} ₫</strong></p>
                      </>
                    )}
                  </div>
                ) : null}

                {canCancel ? (
                  <button className="mc-btn mc-btn--outline" disabled={updating} type="button" onClick={() => setShowCancelModal(true)}>
                    {updating ? "Đang hủy..." : "Hủy lịch hẹn"}
                  </button>
                ) : null}

                {medicalRecord ? (
                  <Link className="mc-btn mc-btn--primary" to={`/medical-records/${medicalRecord.id}`}>
                    Xem hồ sơ bệnh án
                  </Link>
                ) : (
                  <div className="patient-action-disabled">Hồ sơ bệnh án sẽ có sau khi bác sĩ hoàn tất buổi khám.</div>
                )}

                {prescription ? (
                  <>
                    <Link className="mc-btn mc-btn--primary" to={`/prescriptions/${prescription.id}`}>
                      Xem đơn thuốc
                    </Link>
                    {rxPayStatus === "UNPAID" && (
                      <Link
                        to={`/prescriptions/${prescription.id}`}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(234,88,12,0.08)", border: "1.5px solid rgba(234,88,12,0.3)", color: "#ea580c", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
                        Chưa thanh toán tiền thuốc
                      </Link>
                    )}
                    {rxPayStatus === "PENDING" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.25)", color: "#d97706", fontWeight: 600, fontSize: 13 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>hourglass_top</span>
                        Tiền thuốc chờ admin xác nhận
                      </div>
                    )}
                    {rxPayStatus === "PAID" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(22,163,74,0.08)", border: "1.5px solid rgba(22,163,74,0.25)", color: "#16a34a", fontWeight: 600, fontSize: 13 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Đã thanh toán tiền thuốc
                      </div>
                    )}
                  </>
                ) : null}

                {appointment.status === "COMPLETED" ? (
                  <Link className="mc-btn mc-btn--outline" to={`/reviews/create/${appointment.id}`}>
                    Viết đánh giá
                  </Link>
                ) : null}

                <button className="mc-btn mc-btn--outline" type="button" onClick={() => navigate(`/booking?doctorId=${appointment.doctorId}`)}>
                  Đặt lịch lại với bác sĩ
                </button>
              </div>
            </article>
          </aside>
        </div>
      ) : (
        <div className="mc-state"><p>Không tìm thấy lịch hẹn.</p></div>
      )}
    </PatientPageShell>

    {showCancelModal && (() => {
      const preview = getRefundPreview(appointment);
      return (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "16px", padding: "28px 32px", maxWidth: "460px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Xác nhận hủy lịch hẹn</h2>
              <button type="button" onClick={() => setShowCancelModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-soft, #6b7280)", marginBottom: "16px" }}>
              Chính sách hoàn tiền áp dụng khi hủy lịch:
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", marginBottom: "16px" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Thời điểm hủy</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Hoàn tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: preview?.percent === 100 ? "rgba(22,163,74,0.06)" : undefined }}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>Trước 24 giờ so với lịch khám</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>100%</td>
                </tr>
                <tr style={{ background: preview?.percent === 40 ? "rgba(217,119,6,0.06)" : undefined }}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>Từ 6 đến 24 giờ trước lịch khám</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#d97706" }}>40%</td>
                </tr>
                <tr style={{ background: preview?.percent === 0 ? "rgba(220,38,38,0.06)" : undefined }}>
                  <td style={{ padding: "10px 12px" }}>Dưới 6 giờ trước lịch khám</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>0%</td>
                </tr>
              </tbody>
            </table>

            {preview != null && (
              <p style={{ fontSize: "13px", marginBottom: "20px", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.04)", color: "#374151" }}>
                Dự kiến hoàn: <strong style={{ color: preview.color }}>{preview.percent}%</strong> phí đặt lịch — sẽ được cộng ngay vào ví của bạn.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: "8px", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
              >
                Không hủy
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={confirmCancel}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: "#dc2626", color: "#fff", cursor: updating ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", opacity: updating ? 0.7 : 1 }}
              >
                {updating ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
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
