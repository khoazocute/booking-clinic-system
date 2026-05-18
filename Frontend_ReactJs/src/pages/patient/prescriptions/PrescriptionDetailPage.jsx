import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPrescriptionById } from "../../../services/patientPortalService";
import { createPayment, getPaymentByAppointmentId } from "../../../services/paymentService";
import {
  PatientPageShell,
  PatientStatusBadge,
  formatCurrency,
  formatDateTime,
} from "../portal/patientPortalUtils";

const PAYMENT_METHODS = [
  { key: "CASH",          label: "Tiền mặt tại quầy",     icon: "payments" },
  { key: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng", icon: "account_balance" },
];

function resolveRxStatus(payments) {
  const rx = (payments ?? []).find((p) => p.paymentType === "PRESCRIPTION");
  if (!rx) return "UNPAID";
  return rx.status;
}

export function PatientPrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rxStatus, setRxStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    let active = true;
    getPrescriptionById(prescriptionId)
      .then(async (data) => {
        if (!active) return;
        setPrescription(data);
        if (data?.appointmentId && !fetchedRef.current) {
          fetchedRef.current = true;
          try {
            const payRes = await getPaymentByAppointmentId(data.appointmentId);
            const list = payRes?.data ?? payRes ?? [];
            setRxStatus(resolveRxStatus(Array.isArray(list) ? list : [list]));
          } catch {
            setRxStatus("UNPAID");
          }
        }
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [prescriptionId]);

  async function handlePay() {
    setPaying(true);
    setPayError("");
    try {
      await createPayment({
        appointmentId: prescription.appointmentId,
        paymentMethod: payMethod,
        paymentType: "PRESCRIPTION",
      });
      const payRes = await getPaymentByAppointmentId(prescription.appointmentId);
      const list = payRes?.data ?? payRes ?? [];
      setRxStatus(resolveRxStatus(Array.isArray(list) ? list : [list]));
      setShowModal(false);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  }

  const showBanner = rxStatus === "UNPAID" && prescription?.appointmentId && !loading;

  function PayStatusChip() {
    if (rxStatus === "PAID") return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(22,163,74,0.1)", color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>Đã thanh toán
      </span>
    );
    if (rxStatus === "PENDING") return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(217,119,6,0.1)", color: "#d97706", fontWeight: 700, fontSize: 13 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hourglass_top</span>Chờ admin xác nhận
      </span>
    );
    return null;
  }

  return (
    <>
      <PatientPageShell
        eyebrow="Patient Portal / Prescription"
        title={prescription ? `Don thuoc #${prescription.id}` : "Chi tiet don thuoc"}
        description="Thong tin thuoc, lieu dung va huong dan su dung."
        actions={
          <>
            <Link className="mc-btn mc-btn--outline" to="/prescriptions">Danh sach don</Link>
            <PayStatusChip />
            {showBanner && (
              <button className="mc-btn mc-btn--primary" type="button" onClick={() => { setPayError(""); setShowModal(true); }}>
                <span className="material-symbols-outlined">payments</span>
                Thanh toán tiền thuốc
              </button>
            )}
            <button className="mc-btn mc-btn--outline" type="button" onClick={() => window.print()}>In don thuoc</button>
          </>
        }
      >
        {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}

        {showBanner && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 10, background: "rgba(234,88,12,0.08)", border: "1.5px solid rgba(234,88,12,0.25)", marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ color: "#ea580c", fontSize: 22, flexShrink: 0 }}>warning</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#ea580c", fontSize: 14 }}>Chưa thanh toán tiền thuốc</strong>
              <p style={{ margin: 0, fontSize: 13, color: "#78350f" }}>
                Vui lòng thanh toán {formatCurrency(prescription?.totalMedicineFee)} để nhận thuốc tại quầy.
              </p>
            </div>
            <button className="mc-btn mc-btn--primary" type="button" style={{ flexShrink: 0 }} onClick={() => { setPayError(""); setShowModal(true); }}>
              Thanh toán ngay
            </button>
          </div>
        )}

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

      {/* Payment modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => !paying && setShowModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Thanh toán tiền thuốc</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-soft)", margin: "0 0 4px" }}>Số tiền cần thanh toán:</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", margin: "0 0 20px" }}>
              {formatCurrency(prescription?.totalMedicineFee)}
            </p>

            <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>Chọn phương thức thanh toán:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPayMethod(m.key)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `2px solid ${payMethod === m.key ? "var(--primary)" : "#e5e7eb"}`, borderRadius: 10, background: payMethod === m.key ? "rgba(37,99,235,0.06)" : "#fff", cursor: "pointer", textAlign: "left" }}
                >
                  <span className="material-symbols-outlined" style={{ color: payMethod === m.key ? "var(--primary)" : "#6b7280" }}>{m.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                  {payMethod === m.key && (
                    <span className="material-symbols-outlined" style={{ marginLeft: "auto", color: "var(--primary)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {payError && (
              <p style={{ margin: "0 0 12px", padding: "8px 12px", borderRadius: 8, background: "rgba(255,218,214,0.82)", color: "var(--error)", fontSize: 13 }}>
                {payError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowModal(false)} disabled={paying}
                style={{ flex: 1, padding: 10, border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                Huỷ
              </button>
              <button type="button" onClick={handlePay} disabled={paying}
                style={{ flex: 1, padding: 10, border: "none", borderRadius: 8, background: "var(--primary)", color: "#fff", cursor: paying ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, opacity: paying ? 0.7 : 1 }}>
                {paying ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
