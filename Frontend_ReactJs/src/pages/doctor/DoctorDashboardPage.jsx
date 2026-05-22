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

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Dashboard"
      title={doctor ? `Xin chao, ${doctor.fullName}` : "Doctor dashboard"}
      description="Theo doi lich hen, lich lam viec va doanh thu cua bac si."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/schedules">
            Lich lam viec
          </Link>
          <Link className="button button--primary" to="/doctor/appointments">
            Lich hen
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

      <section className="doctor-dashboard-layout doctor-dashboard-layout--single">
        <div className="doctor-dashboard-main">
          <article className="doctor-dashboard-card">
            <div className="doctor-dashboard-card__head">
              <div>
                <h2>Lich hen gan day</h2>
                <p>Danh sach lich hen moi nhat cua bac si.</p>
              </div>
              <Link className="doctor-text-link" to="/doctor/appointments">
                Xem tat ca
              </Link>
            </div>

            {loading ? (
              <p className="empty-state">Dang tai lich hen...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="empty-state">Chua co lich hen.</p>
            ) : (
              <div className="doctor-dashboard-table">
                <div className="doctor-dashboard-table__head">
                  <span>Benh nhan</span>
                  <span>Thoi gian</span>
                  <span>Ly do</span>
                  <span>Trang thai</span>
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
                        Chi tiet
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

        </div>
      </section>
    </DoctorWorkspace>
  );
}
