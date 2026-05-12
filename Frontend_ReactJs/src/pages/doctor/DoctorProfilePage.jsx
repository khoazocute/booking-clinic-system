import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getCurrentDoctorProfile,
  getDoctorSchedules,
} from "../../services/doctorPortalService";
import { formatCurrency, formatTime } from "../../utils/doctorHelpers";

const WEEK_DAYS = [
  { key: 1, label: "Monday", short: "Mon" },
  { key: 2, label: "Tuesday", short: "Tue" },
  { key: 3, label: "Wednesday", short: "Wed" },
  { key: 4, label: "Thursday", short: "Thu" },
  { key: 5, label: "Friday", short: "Fri" },
  { key: 6, label: "Saturday", short: "Sat" },
  { key: 0, label: "Sunday", short: "Sun" },
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
      eyebrow="Dashboard / Doctor / Profile View"
      title="Doctor Profile"
      description="Review professional information, clinic setup, and current operating hours."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor">
            Back to Dashboard
          </Link>
          <Link className="button button--primary" to="/doctor/profile/edit">
            <span className="material-symbols-outlined">edit</span>
            <span>Edit Profile</span>
          </Link>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      {loading ? (
        <p className="empty-state">Loading doctor profile...</p>
      ) : doctor ? (
        <section className="doctor-profile-view">
          <aside className="doctor-profile-view__sidebar">
            <article className="doctor-panel doctor-profile-view__identity">
              <div className="doctor-profile-view__avatar-ring">
                <div className="doctor-profile-view__avatar">{getInitials(doctor.fullName)}</div>
                <span className="doctor-profile-view__status-dot" />
              </div>

              <h2>{doctor.fullName}</h2>
              <p>{doctor.specialtyName || "Doctor"}</p>
              <span className="doctor-profile-view__experience">
                {doctor.experienceYears ? `${doctor.experienceYears} Years Experience` : "Experience not set"}
              </span>

              <div className="doctor-profile-view__contacts">
                <div>
                  <span>Email Address</span>
                  <strong>{doctor.email || "--"}</strong>
                </div>
                <div>
                  <span>Phone Number</span>
                  <strong>{doctor.phone || "--"}</strong>
                </div>
                <div>
                  <span>Primary Clinic</span>
                  <strong>{doctor.clinicRoom || "Central Clinic"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Professional License</h2>
                  <p>Reference information for identity and verification.</p>
                </div>
              </div>

              <div className="doctor-license-card">
                <div>
                  <span>License Number</span>
                  <strong>{doctor.id ? `MD-${String(doctor.id).padStart(5, "0")}` : "--"}</strong>
                </div>
                <div>
                  <span>Issuing Body</span>
                  <strong>{doctor.qualification || "Medical Board"}</strong>
                </div>
              </div>
            </article>
          </aside>

          <div className="doctor-profile-view__content">
            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Biography</h2>
                  <p>Patient-facing overview of expertise, style, and specialty focus.</p>
                </div>
              </div>

              <p className="doctor-long-copy">
                {doctor.biography || "No biography provided yet."}
              </p>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Clinical Information</h2>
                  <p>Snapshot of credentials, consultation fees, and clinic setup.</p>
                </div>
              </div>

              <div className="doctor-clinical-cards">
                <div className="doctor-clinical-card">
                  <span>Qualifications</span>
                  <strong>{doctor.qualification || "--"}</strong>
                </div>
                <div className="doctor-clinical-card">
                  <span>Consultation Fee</span>
                  <strong>{formatCurrency(doctor.consultationFee)}</strong>
                </div>
                <div className="doctor-clinical-card">
                  <span>Clinic Room</span>
                  <strong>{doctor.clinicRoom || "--"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Clinic Hours</h2>
                  <p>Weekly working hours derived from current schedule slots.</p>
                </div>
                <span className="doctor-badge doctor-badge--available">Configured</span>
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
                          <span>to</span>
                          <strong>{formatTime(day.endTime)}</strong>
                        </>
                      ) : (
                        <span className="doctor-hours-row__empty">--:-- to --:--</span>
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
                        {day.status === "AVAILABLE" ? "Available" : "Closed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : (
        <p className="empty-state">Doctor profile not found.</p>
      )}
    </DoctorWorkspace>
  );
}
