import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { getDoctorAppointments } from "../../services/doctorPortalService";
import { formatDate, formatTime } from "../../utils/doctorHelpers";

const FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const PAGE_SIZE = 4;

function getPatientCode(appointment) {
  return `#MP-${appointment.patientId ?? appointment.id}`;
}

function getInitials(name) {
  if (!name) {
    return "PT";
  }

  const parts = String(name).trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        const result = await getDoctorAppointments();
        if (active) {
          setAppointments(result.appointments ?? []);
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

    loadAppointments();

    return () => {
      active = false;
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesFilter =
        activeFilter === "ALL" ? true : appointment.status === activeFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        appointment.patientName?.toLowerCase().includes(keyword) ||
        String(appointment.patientId ?? "").includes(keyword) ||
        getPatientCode(appointment).toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, appointments, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  function handleExport() {
    const rows = filteredAppointments.map((appointment) => [
      appointment.patientName,
      getPatientCode(appointment),
      formatDate(appointment.appointmentDate),
      `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`,
      appointment.reason,
      appointment.status,
    ]);

    const csv = [
      ["Tên bệnh nhân", "Mã bệnh nhân", "Ngày", "Thời gian", "Lý do", "Trạng thái"],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "doctor-appointments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Lịch hẹn"
      title="Lịch hẹn của bác sĩ"
      description="Quản lý lịch khám trong ngày và lượt khám của bệnh nhân."
      actions={
        <>
          <button className="button button--secondary" type="button" onClick={handleExport}>
            Xuất file
          </button>
          <button className="button button--primary" type="button" onClick={() => window.print()}>
            In danh sách
          </button>
        </>
      }
    >
      <section className="doctor-appointments-shell">
        <article className="doctor-appointments-filters">
          <label className="doctor-appointments-search">
            <input
              placeholder="Tìm bệnh nhân theo tên hoặc mã..."
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="doctor-appointments-chip-row">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={`doctor-filter-chip${
                  activeFilter === filter ? " doctor-filter-chip--active" : ""
                }`}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter === "ALL" ? "Tất cả" : <DoctorStatusBadge status={filter} />}
              </button>
            ))}
          </div>
        </article>

        {error ? <p className="empty-state">{error}</p> : null}

        <article className="doctor-appointments-board">
          <header className="doctor-appointments-board__head">
            <span>Tên bệnh nhân</span>
            <span>Ngày &amp; giờ</span>
            <span>Lý do khám</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </header>

          {loading ? (
            <p className="empty-state">Đang tải lịch hẹn...</p>
          ) : paginatedAppointments.length === 0 ? (
            <p className="empty-state">Không có lịch hẹn phù hợp với bộ lọc hiện tại.</p>
          ) : (
            <div className="doctor-appointments-list">
              {paginatedAppointments.map((appointment) => (
                <article className="doctor-appointment-card" key={appointment.id}>
                  <div className="doctor-appointment-card__patient">
                    <div className="doctor-appointment-card__avatar">
                      {getInitials(appointment.patientName)}
                    </div>
                    <div>
                      <h3>{appointment.patientName}</h3>
                      <p>ID: {getPatientCode(appointment)}</p>
                    </div>
                  </div>

                  <div className="doctor-appointment-card__datetime">
                    <strong>{formatDate(appointment.appointmentDate)}</strong>
                    <span>{formatTime(appointment.startTime)}</span>
                  </div>

                  <div className="doctor-appointment-card__reason">
                    {appointment.reason}
                  </div>

                  <div className="doctor-appointment-card__status">
                    <DoctorStatusBadge status={appointment.status} />
                  </div>

                  <div className="doctor-appointment-card__action">
                    <Link
                      className="button button--secondary doctor-appointment-card__button"
                      to={`/doctor/appointments/${appointment.id}`}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredAppointments.length > 0 ? (
            <footer className="doctor-appointments-pagination">
              <p>
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, filteredAppointments.length)} /{" "}
                {filteredAppointments.length} kết quả
              </p>

              <div className="doctor-appointments-pagination__controls">
                <button
                  className="doctor-page-nav"
                  disabled={currentPage === 1}
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {"<"}
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`doctor-page-index${
                      pageNumber === currentPage ? " doctor-page-index--active" : ""
                    }`}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  className="doctor-page-nav"
                  disabled={currentPage === totalPages}
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  {">"}
                </button>
              </div>
            </footer>
          ) : null}
        </article>
      </section>
    </DoctorWorkspace>
  );
}
