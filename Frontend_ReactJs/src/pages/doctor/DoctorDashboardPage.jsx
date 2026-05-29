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

function getRevenueAmount(payment) {
  const amount = Number(payment.amount ?? 0);
  if (payment.status === "REFUNDED" || payment.paymentType === "REFUND") {
    return -amount;
  }
  if (payment.status === "PAID") {
    return amount;
  }
  return 0;
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
    .reduce((sum, payment) => sum + getRevenueAmount(payment), 0);
  const stats = [
    {
      label: "Lịch hẹn",
      value: appointments.filter((item) => item.appointmentDate === today).length,
      eyebrow: "Hôm nay",
      tone: "primary",
      icon: "calendar_month",
    },
    {
      label: "Chờ xác nhận",
      value: appointments.filter((item) => item.status === "PENDING").length,
      eyebrow: "Cần xử lý",
      tone: "warning",
      icon: "event_note",
    },
    {
      label: "Đã hoàn tất",
      value: appointments.filter((item) => item.status === "COMPLETED").length,
      eyebrow: "Đã kết thúc",
      tone: "success",
      icon: "check_circle",
    },
    {
      label: "Doanh thu",
      value: formatCurrency(paidRevenue),
      eyebrow: "Đã thanh toán",
      tone: "secondary",
      icon: "payments",
    },
  ];

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const aCreatedAt = new Date(a.createdAt ?? 0).getTime();
        const bCreatedAt = new Date(b.createdAt ?? 0).getTime();
        if (bCreatedAt !== aCreatedAt) return bCreatedAt - aCreatedAt;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      })
      .slice(0, 4);
  }, [appointments]);

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Tổng quan"
      title={doctor ? `Xin chào, ${doctor.fullName}` : "Tổng quan bác sĩ"}
      description="Theo dõi lịch hẹn, lịch làm việc và doanh thu của bác sĩ."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/schedules">
            Lịch làm việc
          </Link>
          <Link className="button button--primary" to="/doctor/appointments">
            Lịch hẹn
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
                <h2>Lịch hẹn gần đây</h2>
                <p>Danh sách lịch hẹn mới nhất của bác sĩ.</p>
              </div>
              <Link className="doctor-text-link" to="/doctor/appointments">
                Xem tất cả
              </Link>
            </div>

            {loading ? (
              <p className="empty-state">Đang tải lịch hẹn...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="empty-state">Chưa có lịch hẹn.</p>
            ) : (
              <div className="doctor-dashboard-table">
                <div className="doctor-dashboard-table__head">
                  <span>Bệnh nhân</span>
                  <span>Thời gian</span>
                  <span>Lý do</span>
                  <span>Trạng thái</span>
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
