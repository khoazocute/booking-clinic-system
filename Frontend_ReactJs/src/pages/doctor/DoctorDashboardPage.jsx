import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getCurrentDoctorProfile,
  getDoctorAppointments,
  getPaymentsByAppointmentId,
} from "../../services/doctorPortalService";
import { formatCurrency, formatDate, formatTime } from "../../utils/doctorHelpers";

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

export function DoctorDashboardPage() {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [doctorProfile, appointmentResult] = await Promise.all([
          getCurrentDoctorProfile(),
          getDoctorAppointments(),
        ]);

        if (!active) {
          return;
        }

        const appointmentItems = appointmentResult.appointments ?? [];
        const paymentResults = await Promise.allSettled(
          appointmentItems.map((appointment) => getPaymentsByAppointmentId(appointment.id)),
        );
        const paymentItems = paymentResults
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => result.value ?? []);

        setDoctor(doctorProfile);
        setAppointments(appointmentItems);
        setPayments(paymentItems);
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

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const paidRevenue = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const stats = [
    {
      label: "Appointments",
      value: appointments.filter((item) => item.appointmentDate === today).length,
      eyebrow: "Today",
      tone: "primary",
      icon: "calendar_month",
    },
    {
      label: "Pending Confirmation",
      value: appointments.filter((item) => item.status === "PENDING").length,
      eyebrow: "Urgent",
      tone: "warning",
      icon: "event_note",
    },
    {
      label: "Completed",
      value: appointments.filter((item) => item.status === "COMPLETED").length,
      eyebrow: "Finalized",
      tone: "success",
      icon: "check_circle",
    },
    {
      label: "Revenue",
      value: formatCurrency(paidRevenue),
      eyebrow: "Paid",
      tone: "secondary",
      icon: "payments",
    },
  ];

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const aDateTime = new Date(`${a.appointmentDate}T${a.startTime ?? "00:00:00"}`).getTime();
        const bDateTime = new Date(`${b.appointmentDate}T${b.startTime ?? "00:00:00"}`).getTime();
        return bDateTime - aDateTime;
      })
      .slice(0, 4);
  }, [appointments]);

  const quickActions = [
    {
      title: "Patient History",
      description: "Review past medical logs",
      to: "/doctor/appointments",
      tone: "primary",
      icon: "folder_shared",
    },
    {
      title: "Schedule Board",
      description: "Open and adjust time slots",
      to: "/doctor/schedules",
      tone: "success",
      icon: "event_available",
    },
    {
      title: "Notifications",
      description: "Check appointment updates",
      to: "/doctor/notifications",
      tone: "secondary",
      icon: "notifications",
    },
  ];

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Dashboard"
      title={doctor ? `Welcome back, ${doctor.fullName}` : "Doctor dashboard"}
      description="Manage your clinic schedule, patient visits, and follow-up tasks from one focused workspace."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/schedules">
            Manage Schedules
          </Link>
          <Link className="button button--primary" to="/doctor/appointments">
            New Consultation
          </Link>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      <section className="doctor-dashboard-stats">
        {stats.map((item) => (
          <article
            className={`doctor-dashboard-stat doctor-dashboard-stat--${item.tone}`}
            key={item.label}
          >
            <div className="doctor-dashboard-stat__top">
              <div className="doctor-dashboard-stat__icon">
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span>{item.eyebrow}</span>
            </div>
            <p>{item.label}</p>
            <strong>{loading ? "--" : item.value}</strong>
          </article>
        ))}
      </section>

      <section className="doctor-dashboard-layout">
        <div className="doctor-dashboard-main">
          <article className="doctor-dashboard-card">
            <div className="doctor-dashboard-card__head">
              <div>
                <h2>Upcoming Appointments</h2>
                <p>Real-time schedule monitoring</p>
              </div>
              <Link className="doctor-text-link" to="/doctor/appointments">
                View Full Schedule
              </Link>
            </div>

            {loading ? (
              <p className="empty-state">Loading appointments...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="empty-state">No upcoming appointments yet.</p>
            ) : (
              <div className="doctor-dashboard-table">
                <div className="doctor-dashboard-table__head">
                  <span>Patient Name</span>
                  <span>Time / Date</span>
                  <span>Reason</span>
                  <span>Status</span>
                  <span></span>
                </div>

                {upcomingAppointments.map((appointment) => (
                  <div className="doctor-dashboard-row" key={appointment.id}>
                    <div className="doctor-dashboard-patient">
                      <div className="doctor-dashboard-patient__avatar">
                        {getInitials(appointment.patientName)}
                      </div>
                      <div>
                        <strong>{appointment.patientName}</strong>
                        <span>ID: #{appointment.patientId ?? appointment.id}</span>
                      </div>
                    </div>

                    <div className="doctor-dashboard-time">
                      <strong>{formatTime(appointment.startTime)}</strong>
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>

                    <p className="doctor-dashboard-reason">{appointment.reason}</p>

                    <div className="doctor-dashboard-status">
                      <DoctorStatusBadge status={appointment.status} />
                    </div>

                    <div className="doctor-dashboard-row__action">
                      <Link
                        className="button button--secondary doctor-dashboard-row__button"
                        to={`/doctor/appointments/${appointment.id}`}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <section className="doctor-dashboard-tiles">
            <article className="doctor-dashboard-tile doctor-dashboard-tile--primary">
              <div>
                <span>Active Service</span>
                <h3>Telehealth Portal</h3>
                <p>
                  {loading
                    ? "Loading remote session count..."
                    : `${appointments.filter((item) => item.status === "CONFIRMED").length} confirmed sessions ready today.`}
                </p>
              </div>
              <Link className="button button--light" to="/doctor/appointments">
                Open Queue
              </Link>
            </article>

            <article className="doctor-dashboard-tile doctor-dashboard-tile--dark">
              <div>
                <span>Secure Storage</span>
                <h3>Patient Records</h3>
                <p>Jump into clinical documents and continue record flow safely.</p>
              </div>
              <Link className="button button--outline-light" to="/doctor/appointments">
                Open Records
              </Link>
            </article>
          </section>
        </div>

        <aside className="doctor-dashboard-side">
          <article className="doctor-dashboard-profile">
            {loading ? (
              <p className="empty-state">Loading profile...</p>
            ) : doctor ? (
              <>
                <div className="doctor-dashboard-profile__avatar">
                  {getInitials(doctor.fullName)}
                </div>
                <h3>{doctor.fullName}</h3>
                <p>{doctor.specialtyName || "Doctor"}</p>

                <div className="doctor-dashboard-profile__stats">
                  <div>
                    <span>Exp.</span>
                    <strong>
                      {doctor.experienceYears ? `${doctor.experienceYears}+ Years` : "--"}
                    </strong>
                  </div>
                  <div>
                    <span>Room</span>
                    <strong>{doctor.clinicRoom || "--"}</strong>
                  </div>
                  <div>
                    <span>Patients</span>
                    <strong>{appointments.length} Cases</strong>
                  </div>
                  <div>
                    <span>Fee</span>
                    <strong>{formatCurrency(doctor.consultationFee)}</strong>
                  </div>
                </div>

                <Link className="button button--secondary doctor-dashboard-profile__button" to="/doctor/profile">
                  View Full Profile
                </Link>
              </>
            ) : (
              <p className="empty-state">Doctor profile not found.</p>
            )}
          </article>

          <article className="doctor-dashboard-card">
            <div className="doctor-dashboard-card__head">
              <div>
                <h2>Quick Actions</h2>
                <p>Fast access to the most-used tools.</p>
              </div>
            </div>

            <div className="doctor-dashboard-actions">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  className={`doctor-dashboard-action doctor-dashboard-action--${action.tone}`}
                  to={action.to}
                >
                  <div className="doctor-dashboard-action__icon">
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </div>
                  <div>
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </DoctorWorkspace>
  );
}
