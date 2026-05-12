import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getDoctorById, getDoctorSchedules } from "../../../services/doctorService";
import { createAppointment } from "../../../services/appointmentService";
import { getAccessToken } from "../../../services/authService";

const DAYS_AHEAD = 30;

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

function formatTimeSlot(slot) {
  const start = slot.startTime ?? slot.start_time ?? "";
  return start.slice(0, 5);
}

function isMorning(slot) {
  const t = slot.startTime ?? slot.start_time ?? "00:00:00";
  return parseInt(t.slice(0, 2), 10) < 12;
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
  const [success, setSuccess] = useState(false);

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
      await createAppointment({
        doctorId: Number(doctorId),
        scheduleId: selectedSlot.id,
        appointmentDate: selectedDate,
        reason: reason.trim() || null,
      });
      setSuccess(true);
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

  if (success) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-success-wrap">
          <div className="mc-success-icon">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h2>Đặt lịch thành công!</h2>
          <p>
            Lịch khám với <strong>{doctor.fullName}</strong> vào{" "}
            <strong>
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
            </strong>{" "}
            lúc <strong>{selectedSlot && formatTimeSlot(selectedSlot)}</strong> đã được ghi nhận.
          </p>
          <div className="mc-success-actions">
            <Link className="mc-btn mc-btn--primary" to="/my-appointments">
              Xem lịch hẹn
            </Link>
            <Link className="mc-btn mc-btn--outline" to="/doctors">
              Tìm bác sĩ khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="mc-container mc-booking-wrap">
        {/* Step indicator */}
        <div className="mc-step-bar">
          <div className="mc-step">
            <div className="mc-step__circle mc-step__circle--active">1</div>
            <span className="mc-step__label mc-step__label--active">Chọn giờ</span>
          </div>
          <div className="mc-step">
            <div className="mc-step__circle mc-step__circle--inactive">2</div>
            <span className="mc-step__label mc-step__label--inactive">Xác nhận</span>
          </div>
        </div>

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
                            className={`mc-slot-btn${
                              !available
                                ? " mc-slot-btn--disabled"
                                : selectedSlot?.id === slot.id
                                ? " mc-slot-btn--active"
                                : ""
                            }`}
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
                            className={`mc-slot-btn${
                              !available
                                ? " mc-slot-btn--disabled"
                                : selectedSlot?.id === slot.id
                                ? " mc-slot-btn--active"
                                : ""
                            }`}
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
                    {doctor.avatarUrl ? (
                      <img src={doctor.avatarUrl} alt={doctor.fullName} />
                    ) : (
                      <span className="mc-summary-avatar-initial">
                        {doctor.fullName?.[0] ?? "B"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="mc-summary-doc-name">{doctor.fullName}</p>
                    <p className="mc-summary-doc-specialty">
                      {doctor.specialtyName ?? "Chuyên khoa"}
                    </p>
                    {doctor.averageRating != null && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "15px", color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "700" }}>
                          {Number(doctor.averageRating).toFixed(1)}
                        </span>
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
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
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
                  <p
                    style={{
                      margin: 0,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(255,218,214,0.82)",
                      color: "var(--error)",
                      fontSize: "14px",
                    }}
                  >
                    {submitError}
                  </p>
                )}

                <button
                  className="mc-confirm-btn"
                  type="submit"
                  disabled={!selectedSlot || submitting}
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                  {!submitting && (
                    <span className="material-symbols-outlined">arrow_forward</span>
                  )}
                </button>

                <p className="mc-secure-note">
                  <span className="material-symbols-outlined">lock</span>
                  Đặt lịch an toàn & bảo mật
                </p>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
