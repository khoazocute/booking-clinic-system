import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SafeAvatar } from "../../../components/common/SafeAvatar";
import { getDoctorById, getDoctorSchedules } from "../../../services/doctorService";
import { createAppointment } from "../../../services/appointmentService";
import { createPayment } from "../../../services/paymentService";
import { getAccessToken } from "../../../services/authService";
import { buildVNPayUrl } from "../../../services/vnpayService";
import { getDoctorAvatar } from "../../../utils/doctorHelpers";

const DAYS_AHEAD = 30;

const PAYMENT_METHODS = [
  {
    key: "CASH",
    label: "Tiền mặt tại quầy",
    desc: "Thanh toán khi đến phòng khám",
    icon: "payments",
  },
  {
    key: "BANK_TRANSFER",
    label: "Chuyển khoản ngân hàng",
    desc: "Chuyển khoản trước hoặc tại quầy",
    icon: "account_balance",
  },
  {
    key: "E_WALLET",
    label: "Ví điện tử",
    desc: "MoMo, ZaloPay, VNPay...",
    icon: "phone_iphone",
  },
];

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.toLocaleDateString("vi-VN", { weekday: "short" }),
    num: d.getDate(),
    month: d.toLocaleDateString("vi-VN", { month: "short" }),
  };
}

function formatDateFull(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeSlot(slot) {
  const start = slot.startTime ?? slot.start_time ?? "";
  return start.slice(0, 5);
}

function isMorning(slot) {
  const t = slot.startTime ?? slot.start_time ?? "00:00:00";
  return parseInt(t.slice(0, 2), 10) < 12;
}

function formatFee(fee) {
  if (fee == null || fee === 0 || Number(fee) === 0) return "Miễn phí";
  return Number(fee).toLocaleString("vi-VN") + " ₫";
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = searchParams.get("doctorId");

  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 3-step flow: 1 = chọn giờ, 2 = thanh toán, 3 = hoàn tất
  const [step, setStep] = useState(1);
  const [appointmentId, setAppointmentId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showQR, setShowQR] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAgreed, setRefundAgreed] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const today = new Date();
  const fromDate = toISODate(today);
  const toDate = toISODate(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + DAYS_AHEAD)
  );

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getDoctorById(doctorId),
      getDoctorSchedules(doctorId, { fromDate, toDate }),
    ])
      .then(([docRes, schedRes]) => {
        if (!active) return;
        setDoctor(docRes?.data ?? docRes ?? null);
        const slots = schedRes?.data?.items ?? schedRes?.data ?? [];
        setSchedules(slots);
        const dates = [...new Set(slots.map((s) => s.workDate ?? s.work_date))].sort();
        if (dates.length > 0) setSelectedDate(dates[0]);
        setLoading(false);
      })
      .catch((err) => {
        if (active) { setError(err.message); setLoading(false); }
      });

    return () => { active = false; };
  }, [doctorId]);

  const grouped = useMemo(() =>
    schedules.reduce((acc, s) => {
      const key = s.workDate ?? s.work_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {}),
    [schedules]
  );

  const availableDates = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const slotsForDate = selectedDate ? (grouped[selectedDate] ?? []) : [];
  const morningSlots = slotsForDate.filter(isMorning);
  const afternoonSlots = slotsForDate.filter((s) => !isMorning(s));

  function handleDateSelect(date) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  // Countdown timer: chạy khi có paymentDeadline
  useEffect(() => {
    if (!paymentDeadline || step !== 2) return;

    function tick() {
      const remaining = Math.max(0, Math.floor((new Date(paymentDeadline) - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) clearInterval(countdownRef.current);
    }
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => clearInterval(countdownRef.current);
  }, [paymentDeadline, step]);

  function formatCountdown(secs) {
    if (secs == null) return null;
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Step 1 → Step 2: tạo appointment, chuyển sang chọn thanh toán
  async function handleConfirm(e) {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!getAccessToken()) {
      navigate("/login", {
        state: { from: window.location.pathname + window.location.search },
      });
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await createAppointment({
        doctorId: Number(doctorId),
        scheduleId: selectedSlot.id,
        appointmentDate: selectedDate,
        reason: reason.trim() || null,
      });
      const appt = res?.data ?? res;
      setAppointmentId(appt?.id ?? null);
      setPaymentDeadline(appt?.paymentDeadline ?? null);
      setStep(2);
    } catch (err) {
      if (err.message?.toLowerCase().includes("patient profile")) {
        navigate(`/profile?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2: bấm xác nhận → hiện modal chính sách hoàn tiền trước
  function handlePaymentConfirm() {
    setRefundAgreed(false);
    setShowRefundModal(true);
  }

  // Sau khi đồng ý chính sách hoàn tiền → thực hiện thanh toán
  async function handleRefundConfirm() {
    setShowRefundModal(false);
    if (paymentMethod === "CASH") {
      setPaymentLoading(true);
      try {
        await createPayment({ appointmentId, paymentMethod: "CASH", paymentType: "BOOKING" });
        setStep(3);
      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setPaymentLoading(false);
      }
    } else if (paymentMethod === "BANK_TRANSFER") {
      setShowQR(true);
    } else if (paymentMethod === "E_WALLET") {
      sessionStorage.setItem("pendingAppointmentId", String(appointmentId));
      setIsRedirecting(true);
      const fee = Number(doctor?.consultationFee ?? 0);
      const amount = fee > 0 ? fee : 10000;
      const txnRef = `MC${Date.now()}`.slice(0, 20);
      const returnUrl = `${window.location.origin}/payment/return`;
      try {
        const url = await buildVNPayUrl({
          amount,
          orderInfo: `Thanh toan lich kham - Ma GD ${txnRef}`,
          txnRef,
          returnUrl,
        });
        window.location.href = url;
      } catch {
        setIsRedirecting(false);
      }
    }
  }

  // BANK_TRANSFER: người dùng xác nhận đã chuyển khoản → tạo payment
  async function handleBankTransferDone() {
    setPaymentLoading(true);
    try {
      await createPayment({ appointmentId, paymentMethod: "BANK_TRANSFER", paymentType: "BOOKING" });
      setStep(3);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  }

  // ─── Guard states ─────────────────────────────────────
  if (!doctorId) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state mc-state--error">
          <p>Không tìm thấy thông tin bác sĩ. Vui lòng chọn lại.</p>
          <Link className="mc-btn mc-btn--outline" to="/doctors">Tìm bác sĩ</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state"><p>Đang tải...</p></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state mc-state--error">
          <p>{error || "Không tìm thấy thông tin bác sĩ."}</p>
          <Link className="mc-btn mc-btn--outline" to="/doctors">Quay lại</Link>
        </div>
      </div>
    );
  }

  // ─── Step 3: Hoàn tất ─────────────────────────────────
  if (step === 3) {
    const chosenMethod = PAYMENT_METHODS.find((m) => m.key === paymentMethod);
    return (
      <div className="browse-page">
        <div className="mc-container mc-success-wrap">
          <div className="mc-success-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2>Đặt lịch thành công!</h2>
          <p>
            Lịch khám với <strong>{doctor.fullName}</strong> vào{" "}
            <strong>{formatDateFull(selectedDate)}</strong>{" "}
            lúc <strong>{selectedSlot && formatTimeSlot(selectedSlot)}</strong> đã được ghi nhận.
          </p>

          <div className="pay-success-info">
            <div className="pay-success-row">
              <span className="material-symbols-outlined">payments</span>
              <div>
                <p className="pay-success-row__label">Phí khám</p>
                <p className="pay-success-row__value" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  {formatFee(doctor?.consultationFee)}
                </p>
              </div>
            </div>
            <div className="pay-success-row">
              <span className="material-symbols-outlined">{chosenMethod?.icon}</span>
              <div>
                <p className="pay-success-row__label">Phương thức thanh toán</p>
                <p className="pay-success-row__value">{chosenMethod?.label}</p>
              </div>
            </div>
            {paymentMethod === "CASH" && (
              <p className="pay-success-note">
                <span className="material-symbols-outlined">info</span>
                Vui lòng đến quầy thanh toán trước giờ khám để hoàn tất.
              </p>
            )}
            {paymentMethod === "BANK_TRANSFER" && (
              <p className="pay-success-note">
                <span className="material-symbols-outlined">info</span>
                Thông tin chuyển khoản sẽ được gửi qua email đã đăng ký.
              </p>
            )}
            {paymentMethod === "E_WALLET" && (
              <p className="pay-success-note">
                <span className="material-symbols-outlined">info</span>
                Hướng dẫn thanh toán ví điện tử sẽ được gửi qua email.
              </p>
            )}
          </div>

          <div className="mc-success-actions">
            <Link className="mc-btn mc-btn--primary" to="/doctors">
              Tìm bác sĩ khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step indicator ────────────────────────────────────
  const steps = [
    { label: "Chọn giờ", num: 1 },
    { label: "Thanh toán", num: 2 },
    { label: "Hoàn tất", num: 3 },
  ];

  return (
    <>
    <div className="browse-page">
      <div className="mc-container mc-booking-wrap">

        {/* Step bar */}
        <div className="mc-step-bar">
          {steps.map((s, i) => (
            <div key={s.num} className="mc-step-item">
              <div className={`mc-step__circle ${step > s.num ? "mc-step__circle--done" : step === s.num ? "mc-step__circle--active" : "mc-step__circle--inactive"}`}>
                {step > s.num
                  ? <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
                  : s.num
                }
              </div>
              <span className={`mc-step__label ${step === s.num ? "mc-step__label--active" : "mc-step__label--inactive"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`mc-step__line ${step > s.num ? "mc-step__line--done" : ""}`} />}
            </div>
          ))}
        </div>

        {/* ══ Step 1: Chọn giờ ══════════════════════════════ */}
        {step === 1 && (
          <div className="mc-booking-layout">
            {/* Left column */}
            <div className="mc-booking-left">
              <div className="mc-cal-card">
                <h2>Chọn ngày khám</h2>
                {availableDates.length === 0 ? (
                  <p style={{ color: "var(--text-soft)", fontSize: "15px" }}>
                    Hiện không có lịch trống trong {DAYS_AHEAD} ngày tới.
                  </p>
                ) : (
                  <div className="mc-date-row">
                    {availableDates.map((date) => {
                      const { day, num, month } = formatDateLabel(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          className={`mc-date-btn${selectedDate === date ? " mc-date-btn--active" : ""}`}
                          onClick={() => handleDateSelect(date)}
                        >
                          <span className="mc-date-btn__day">{day}</span>
                          <span className="mc-date-btn__num">{num}</span>
                          <span className="mc-date-btn__mo">{month}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedDate && (morningSlots.length > 0 || afternoonSlots.length > 0) && (
                <div className="mc-slot-card">
                  <h3>Khung giờ trống</h3>
                  {morningSlots.length > 0 && (
                    <div className="mc-slot-group">
                      <div className="mc-slot-group__label">
                        <span className="material-symbols-outlined">wb_sunny</span>
                        Buổi sáng
                      </div>
                      <div className="mc-slot-grid">
                        {morningSlots.map((slot) => {
                          const available = slot.status === "AVAILABLE";
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!available}
                              className={`mc-slot-btn${!available ? " mc-slot-btn--disabled" : selectedSlot?.id === slot.id ? " mc-slot-btn--active" : ""}`}
                              onClick={() => available && setSelectedSlot(slot)}
                            >
                              {formatTimeSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {afternoonSlots.length > 0 && (
                    <div className="mc-slot-group">
                      <div className="mc-slot-group__label">
                        <span className="material-symbols-outlined">partly_cloudy_day</span>
                        Buổi chiều
                      </div>
                      <div className="mc-slot-grid">
                        {afternoonSlots.map((slot) => {
                          const available = slot.status === "AVAILABLE";
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!available}
                              className={`mc-slot-btn${!available ? " mc-slot-btn--disabled" : selectedSlot?.id === slot.id ? " mc-slot-btn--active" : ""}`}
                              onClick={() => available && setSelectedSlot(slot)}
                            >
                              {formatTimeSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedDate && morningSlots.length === 0 && afternoonSlots.length === 0 && (
                <div className="mc-slot-card">
                  <p style={{ color: "var(--text-soft)", margin: 0 }}>
                    Không có khung giờ trống cho ngày này.
                  </p>
                </div>
              )}
            </div>

            {/* Right column: summary */}
            <aside className="mc-booking-right">
              <div className="mc-summary-card">
                <div className="mc-summary-card__header">
                  <h3>Tóm tắt lịch hẹn</h3>
                  <p>Kiểm tra thông tin trước khi xác nhận</p>
                </div>
                <form className="mc-summary-body" onSubmit={handleConfirm}>
                  <div className="mc-summary-doctor">
                    <div className="mc-summary-avatar">
                      <SafeAvatar
                        src={doctor.avatarUrl}
                        alt={doctor.fullName}
                        name={doctor.fullName}
                        fallbackClassName="mc-summary-avatar-initial"
                        defaultSrc={getDoctorAvatar(doctor.id)}
                      />
                    </div>
                    <div>
                      <p className="mc-summary-doc-name">{doctor.fullName}</p>
                      <p className="mc-summary-doc-specialty">{doctor.specialtyName ?? "Chuyên khoa"}</p>
                      {doctor.averageRating != null && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span style={{ fontSize: "13px", fontWeight: "700" }}>{Number(doctor.averageRating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mc-summary-rows">
                    <div className="mc-summary-row">
                      <div className="mc-summary-row-label">
                        <span className="material-symbols-outlined">calendar_today</span>
                        Ngày khám
                      </div>
                      <span className="mc-summary-row-value">
                        {selectedDate
                          ? new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                    <div className="mc-summary-row">
                      <div className="mc-summary-row-label">
                        <span className="material-symbols-outlined">schedule</span>
                        Giờ khám
                      </div>
                      <span className="mc-summary-row-value">
                        {selectedSlot ? formatTimeSlot(selectedSlot) : "—"}
                      </span>
                    </div>
                    <div className="mc-summary-row">
                      <div className="mc-summary-row-label">
                        <span className="material-symbols-outlined">payments</span>
                        Phí khám
                      </div>
                      <span className="mc-summary-row-value" style={{ color: "var(--primary)", fontWeight: 700 }}>
                        {formatFee(doctor?.consultationFee)}
                      </span>
                    </div>
                  </div>

                  <div className="mc-reason-field">
                    <label htmlFor="booking-reason">Lý do khám</label>
                    <textarea
                      id="booking-reason"
                      className="mc-reason-textarea"
                      rows={3}
                      placeholder="Mô tả triệu chứng... (không bắt buộc)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {submitError && (
                    <p style={{ margin: 0, padding: "10px 14px", borderRadius: "8px", background: "rgba(255,218,214,0.82)", color: "var(--error)", fontSize: "14px" }}>
                      {submitError}
                    </p>
                  )}

                  <button className="mc-confirm-btn" type="submit" disabled={!selectedSlot || submitting}>
                    {submitting ? "Đang xử lý..." : "Tiếp theo: Thanh toán"}
                    {!submitting && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>

                  <p className="mc-secure-note">
                    <span className="material-symbols-outlined">lock</span>
                    Đặt lịch an toàn & bảo mật
                  </p>
                </form>
              </div>
            </aside>
          </div>
        )}

        {/* ══ Step 2: Thanh toán ════════════════════════════ */}
        {step === 2 && (
          <div className="pay-layout">
            {/* Countdown timer */}
            {countdown != null && (
              <div className={`pay-countdown${countdown <= 60 ? " pay-countdown--urgent" : ""}`}>
                <span className="material-symbols-outlined">timer</span>
                <span>
                  Hoàn tất thanh toán trong&nbsp;
                  <strong>{formatCountdown(countdown)}</strong>
                  {countdown === 0 && " — Lịch hẹn đã bị huỷ tự động"}
                </span>
              </div>
            )}

            {/* Left: method selection + method-specific content */}
            <div className="pay-left">
              {/* Method selector — ẩn khi đang hiện QR hoặc redirect */}
              {!showQR && !isRedirecting && (
                <div className="pay-method-card-wrap">
                  <h2 className="pay-section-title">Chọn phương thức thanh toán</h2>
                  <p className="pay-section-sub">Lịch khám đã được đặt thành công. Vui lòng chọn cách thanh toán.</p>
                  <div className="pay-methods">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        className={`pay-method${paymentMethod === m.key ? " pay-method--active" : ""}`}
                        onClick={() => setPaymentMethod(m.key)}
                      >
                        <div className="pay-method__icon-wrap">
                          <span className="material-symbols-outlined">{m.icon}</span>
                        </div>
                        <div className="pay-method__text">
                          <span className="pay-method__label">{m.label}</span>
                          <span className="pay-method__desc">{m.desc}</span>
                        </div>
                        <div className="pay-method__check">
                          {paymentMethod === m.key && (
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VietQR — hiện khi chọn BANK_TRANSFER và bấm xác nhận */}
              {showQR && (
                <div className="pay-qr-wrap">
                  <div className="pay-qr-header">
                    <span className="material-symbols-outlined pay-qr-header__icon">qr_code_2</span>
                    <div>
                      <h2 className="pay-section-title" style={{ margin: 0 }}>Quét mã QR để thanh toán</h2>
                      <p className="pay-section-sub" style={{ margin: "4px 0 0" }}>Dùng app ngân hàng hoặc ví điện tử để quét</p>
                    </div>
                  </div>

                  <div className="pay-qr-card">
                    <img
                      className="pay-qr-img"
                      src={`https://img.vietqr.io/image/TPB-15717052005-compact.png?amount=${Math.max(Number(doctor?.consultationFee ?? 0), 10000)}&addInfo=Thanh toan kham BS ${encodeURIComponent(doctor?.fullName ?? "")}&accountName=PHONG KHAM MEDICARE`}
                      alt="VietQR thanh toán"
                    />
                    <div className="pay-qr-bank-info">
                      <div className="pay-qr-bank-row">
                        <span className="pay-qr-bank-row__label">Ngân hàng</span>
                        <span className="pay-qr-bank-row__val">TPBank</span>
                      </div>
                      <div className="pay-qr-bank-row">
                        <span className="pay-qr-bank-row__label">Số tài khoản</span>
                        <span className="pay-qr-bank-row__val pay-qr-bank-row__val--mono">15717052005</span>
                      </div>
                      <div className="pay-qr-bank-row">
                        <span className="pay-qr-bank-row__label">Chủ tài khoản</span>
                        <span className="pay-qr-bank-row__val">PHONG KHAM MEDICARE</span>
                      </div>
                      <div className="pay-qr-bank-row">
                        <span className="pay-qr-bank-row__label">Số tiền</span>
                        <span className="pay-qr-bank-row__val" style={{ color: "var(--primary)", fontWeight: 700 }}>
                          {formatFee(Math.max(Number(doctor?.consultationFee ?? 0), 10000))}
                        </span>
                      </div>
                      <div className="pay-qr-bank-row">
                        <span className="pay-qr-bank-row__label">Nội dung CK</span>
                        <span className="pay-qr-bank-row__val pay-qr-bank-row__val--mono">
                          Kham BS {doctor?.fullName ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="mc-confirm-btn" type="button" onClick={handleBankTransferDone} disabled={paymentLoading}>
                    {paymentLoading ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                    {!paymentLoading && <span className="material-symbols-outlined">check</span>}
                  </button>
                  <button className="pay-back-btn" type="button" onClick={() => setShowQR(false)}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Chọn phương thức khác
                  </button>
                </div>
              )}

              {/* VNPay redirect loading */}
              {isRedirecting && (
                <div className="pay-redirect-wrap">
                  <div className="pay-redirect-spinner" />
                  <p className="pay-redirect-text">Đang chuyển đến cổng VNPay...</p>
                  <p className="pay-redirect-sub">Vui lòng không đóng tab này.</p>
                </div>
              )}
            </div>

            {/* Right: order summary */}
            <aside className="pay-right">
              <div className="pay-summary-card">
                <h3 className="pay-summary-title">Chi tiết đơn hàng</h3>

                <div className="pay-summary-doctor">
                  <div className="mc-summary-avatar">
                    <SafeAvatar
                      src={doctor.avatarUrl}
                      name={doctor.fullName}
                      imageClassName=""
                      fallbackClassName="mc-summary-avatar-initial"
                      defaultSrc={getDoctorAvatar(doctor.id)}
                    />
                  </div>
                  <div>
                    <p className="mc-summary-doc-name">{doctor.fullName}</p>
                    <p className="mc-summary-doc-specialty">{doctor.specialtyName ?? "Chuyên khoa"}</p>
                  </div>
                </div>

                <div className="pay-summary-rows">
                  <div className="pay-summary-row">
                    <span className="pay-summary-row__key">
                      <span className="material-symbols-outlined">calendar_today</span>
                      Ngày khám
                    </span>
                    <span className="pay-summary-row__val">
                      {selectedDate
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="pay-summary-row">
                    <span className="pay-summary-row__key">
                      <span className="material-symbols-outlined">schedule</span>
                      Giờ khám
                    </span>
                    <span className="pay-summary-row__val">
                      {selectedSlot ? formatTimeSlot(selectedSlot) : "—"}
                    </span>
                  </div>
                  <div className="pay-summary-row">
                    <span className="pay-summary-row__key">
                      <span className="material-symbols-outlined">stethoscope</span>
                      Phí khám
                    </span>
                    <span className="pay-summary-row__val">{formatFee(doctor?.consultationFee)}</span>
                  </div>
                </div>

                <div className="pay-total-row">
                  <span>Tổng cộng</span>
                  <span className="pay-total-amount">{formatFee(doctor?.consultationFee)}</span>
                </div>

                {!showQR && !isRedirecting && (
                  <>
                    <button
                      className="mc-confirm-btn"
                      type="button"
                      onClick={handlePaymentConfirm}
                    >
                      {paymentMethod === "E_WALLET" ? "Thanh toán qua VNPay" : paymentMethod === "BANK_TRANSFER" ? "Hiện mã QR" : "Xác nhận thanh toán"}
                      <span className="material-symbols-outlined">
                        {paymentMethod === "E_WALLET" ? "open_in_new" : paymentMethod === "BANK_TRANSFER" ? "qr_code_2" : "check"}
                      </span>
                    </button>
                    <button className="pay-back-btn" type="button" onClick={() => setStep(1)}>
                      <span className="material-symbols-outlined">arrow_back</span>
                      Quay lại
                    </button>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}

      </div>
    </div>

    {/* ── Modal chính sách hoàn tiền ───────────────────────── */}
    {showRefundModal && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setShowRefundModal(false)}
      >
        <div
          style={{ background: "#fff", borderRadius: "16px", padding: "28px 32px", maxWidth: "480px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Chính sách hoàn tiền</h2>
            <button type="button" onClick={() => setShowRefundModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <p style={{ fontSize: "14px", color: "var(--text-soft)", marginBottom: "16px" }}>
            Vui lòng đọc kỹ chính sách hoàn tiền trước khi xác nhận đặt lịch.
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", marginBottom: "20px" }}>
            <thead>
              <tr style={{ background: "var(--bg-soft, #f8f9fa)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Thời điểm huỷ</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Hoàn tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>Trước 24 giờ so với lịch khám</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>100%</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>Từ 6 đến 24 giờ trước lịch khám</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#d97706" }}>40%</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 12px" }}>Dưới 6 giờ trước lịch khám</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>0%</td>
              </tr>
            </tbody>
          </table>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: "20px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={refundAgreed}
              onChange={(e) => setRefundAgreed(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "var(--primary)", width: "16px", height: "16px", flexShrink: 0 }}
            />
            Tôi đã đọc và đồng ý với chính sách hoàn tiền của phòng khám
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowRefundModal(false)}
              style={{ flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: "8px", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={!refundAgreed}
              onClick={handleRefundConfirm}
              style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: refundAgreed ? "var(--primary)" : "#d1d5db", color: refundAgreed ? "#fff" : "#9ca3af", cursor: refundAgreed ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "14px" }}
            >
              Xác nhận &amp; Tiếp tục
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
