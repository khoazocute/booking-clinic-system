import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAppointments } from "../../../services/patientPortalService";
import {
  EmptyState,
  PatientPageShell,
  PatientStatusBadge,
  formatDate,
  formatTime,
} from "../portal/patientPortalUtils";

const FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyAppointments()
      .then((response) => {
        if (active) setAppointments(response?.data ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesStatus = activeFilter === "ALL" || appointment.status === activeFilter;
      const matchesSearch =
        !keyword ||
        appointment.doctorName?.toLowerCase().includes(keyword) ||
        appointment.reason?.toLowerCase().includes(keyword) ||
        String(appointment.id).includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, appointments, search]);

  return (
    <PatientPageShell
      eyebrow="Patient Portal"
      title="Lịch hẹn của tôi"
      description="Theo dõi lịch khám, trạng thái xác nhận và kết quả sau buổi khám."
      actions={
        <Link className="mc-btn mc-btn--primary" to="/doctors">
          Đặt lịch mới
        </Link>
      }
    >
      <section className="patient-toolbar">
        <label className="patient-search">
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Tìm theo bác sĩ, lý do khám hoặc mã lịch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="patient-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`patient-tab${activeFilter === filter ? " patient-tab--active" : ""}`}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "ALL" ? "Tất cả" : filter}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}

      {loading ? (
        <div className="mc-state"><p>Đang tải lịch hẹn...</p></div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title="Chưa có lịch hẹn phù hợp"
          description="Bạn có thể tìm bác sĩ và đặt lịch khám mới bất cứ lúc nào."
          action={<Link className="mc-btn mc-btn--primary" to="/doctors">Tìm bác sĩ</Link>}
        />
      ) : (
        <div className="patient-card-list">
          {filteredAppointments.map((appointment) => (
            <article className="patient-appointment-card" key={appointment.id}>
              <div className="patient-appointment-card__main">
                <div className="patient-avatar-token">
                  {(appointment.doctorName ?? "DR").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="patient-row-title">
                    <h2>{appointment.doctorName ?? "Bác sĩ"}</h2>
                    <PatientStatusBadge status={appointment.status} />
                  </div>
                  <p>{appointment.reason || "Chưa có lý do khám"}</p>
                  <div className="patient-meta-row">
                    <span>
                      <span className="material-symbols-outlined">calendar_today</span>
                      {formatDate(appointment.appointmentDate)}
                    </span>
                    <span>
                      <span className="material-symbols-outlined">schedule</span>
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </span>
                    <span>#{appointment.id}</span>
                  </div>
                </div>
              </div>

              <div className="patient-card-actions">
                <Link className="mc-btn mc-btn--outline" to={`/my-appointments/${appointment.id}`}>
                  Xem chi tiết
                </Link>
                {appointment.status === "COMPLETED" ? (
                  <Link className="mc-btn mc-btn--primary" to={`/reviews/create/${appointment.id}`}>
                    Viết đánh giá
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
