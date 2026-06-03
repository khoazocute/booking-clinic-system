import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getCurrentDoctorProfile,
  getDoctorSchedules,
} from "../../services/doctorPortalService";
import { formatCurrency, formatTime } from "../../utils/doctorHelpers";

const WEEK_DAYS = [
  { key: 1, label: "Thứ hai", short: "T2" },
  { key: 2, label: "Thứ ba", short: "T3" },
  { key: 3, label: "Thứ tư", short: "T4" },
  { key: 4, label: "Thứ năm", short: "T5" },
  { key: 5, label: "Thứ sáu", short: "T6" },
  { key: 6, label: "Thứ bảy", short: "T7" },
  { key: 0, label: "Chủ nhật", short: "CN" },
];

function getInitials(name) {
  if (!name) {
    return "DR";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getWeekDayNumber(value) {
  if (!value) {
    return null;
  }

  return new Date(value).getDay();
}

export function DoctorProfilePage() {
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const [doctorProfile, scheduleResult] = await Promise.all([
          getCurrentDoctorProfile(),
          getDoctorSchedules(),
        ]);

        if (active) {
          setDoctor(doctorProfile);
          setSchedules(scheduleResult.schedules ?? []);
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

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const clinicHours = useMemo(() => {
    return WEEK_DAYS.map((day) => {
      const daySchedules = schedules
        .filter((item) => getWeekDayNumber(item.workDate) === day.key)
        .sort((left, right) => String(left.startTime).localeCompare(String(right.startTime)));

      if (daySchedules.length === 0) {
        return {
          ...day,
          startTime: null,
          endTime: null,
          status: "CLOSED",
        };
      }

      const available = daySchedules.find((item) => item.status !== "CANCELLED") ?? daySchedules[0];

      return {
        ...day,
        startTime: available.startTime,
        endTime: available.endTime,
        status: available.status === "CANCELLED" ? "CLOSED" : "AVAILABLE",
      };
    });
  }, [schedules]);

  return (
    <DoctorWorkspace
      eyebrow="Tổng quan / Bác sĩ / Hồ sơ"
      title="Hồ sơ bác sĩ"
      description="Xem thông tin chuyên môn, phòng khám và giờ làm việc hiện tại."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor">
            Quay lại tổng quan
          </Link>
          <Link className="button button--primary" to="/doctor/profile/edit">
            <span className="material-symbols-outlined">edit</span>
            <span>Sửa hồ sơ</span>
          </Link>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      {loading ? (
        <p className="empty-state">Đang tải hồ sơ bác sĩ...</p>
      ) : doctor ? (
        <section className="doctor-profile-view">
          <aside className="doctor-profile-view__sidebar">
            <article className="doctor-panel doctor-profile-view__identity">
              <div className="doctor-profile-view__avatar-ring">
                <div className="doctor-profile-view__avatar">{getInitials(doctor.fullName)}</div>
                <span className="doctor-profile-view__status-dot" />
              </div>

              <h2>{doctor.fullName}</h2>
              <p>{doctor.specialtyName || "Bác sĩ"}</p>
              <span className="doctor-profile-view__experience">
                {doctor.experienceYears ? `${doctor.experienceYears} năm kinh nghiệm` : "Chưa cập nhật kinh nghiệm"}
              </span>

              <div className="doctor-profile-view__contacts">
                <div>
                  <span>Email</span>
                  <strong>{doctor.email || "--"}</strong>
                </div>
                <div>
                  <span>Số điện thoại</span>
                  <strong>{doctor.phone || "--"}</strong>
                </div>
                <div>
                  <span>Phòng khám chính</span>
                  <strong>{doctor.clinicRoom || "Phòng khám trung tâm"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Chứng chỉ hành nghề</h2>
                  <p>Thông tin tham chiếu để định danh và xác minh.</p>
                </div>
              </div>

              <div className="doctor-license-card">
                <div>
                  <span>Số giấy phép hành nghề</span>
                  <strong>{doctor.licenseNumber || "Chưa cập nhật"}</strong>
                </div>
                <div>
                  <span>Hạn giấy phép</span>
                  <strong>{doctor.licenseExpiryDate || "Chưa cập nhật"}</strong>
                </div>
                <div>
                  <span>Trạng thái giấy phép</span>
                  <strong>{doctor.licenseStatus || "Chưa cập nhật"}</strong>
                </div>
              </div>
            </article>
          </aside>

          <div className="doctor-profile-view__content">
            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Giới thiệu</h2>
                  <p>Tổng quan về chuyên môn, phong cách khám và chuyên khoa hiển thị cho bệnh nhân.</p>
                </div>
              </div>

              <p className="doctor-long-copy">
                {doctor.biography || "Chưa cập nhật giới thiệu."}
              </p>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Thông tin khám bệnh</h2>
                  <p>Tóm tắt bằng cấp, phí khám và phòng khám.</p>
                </div>
              </div>

              <div className="doctor-clinical-cards">
                <div className="doctor-clinical-card">
                  <span>Bằng cấp</span>
                  <strong>{doctor.qualification || "--"}</strong>
                </div>
                <div className="doctor-clinical-card">
                  <span>Phí khám</span>
                  <strong>{formatCurrency(doctor.consultationFee)}</strong>
                </div>
                <div className="doctor-clinical-card">
                  <span>Phòng khám</span>
                  <strong>{doctor.clinicRoom || "--"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Giờ làm việc</h2>
                  <p>Giờ khám theo tuần dựa trên các khung lịch hiện tại.</p>
                </div>
                <span className="doctor-badge doctor-badge--available">Đã cấu hình</span>
              </div>

              <div className="doctor-hours-list">
                {clinicHours.map((day) => (
                  <div className="doctor-hours-row" key={day.label}>
                    <div className="doctor-hours-row__day">
                      <span>{day.short}</span>
                      <strong>{day.label}</strong>
                    </div>

                    <div className="doctor-hours-row__time">
                      {day.startTime && day.endTime ? (
                        <>
                          <strong>{formatTime(day.startTime)}</strong>
                          <span>đến</span>
                          <strong>{formatTime(day.endTime)}</strong>
                        </>
                      ) : (
                        <span className="doctor-hours-row__empty">--:-- đến --:--</span>
                      )}
                    </div>

                    <div className="doctor-hours-row__status">
                      <span
                        className={`doctor-badge ${
                          day.status === "AVAILABLE"
                            ? "doctor-badge--available"
                            : "doctor-badge--cancelled"
                        }`}
                      >
                        {day.status === "AVAILABLE" ? "Có lịch" : "Nghỉ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : (
        <p className="empty-state">Không tìm thấy hồ sơ bác sĩ.</p>
      )}
    </DoctorWorkspace>
  );
}
