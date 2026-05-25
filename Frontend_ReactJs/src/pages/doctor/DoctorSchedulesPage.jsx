import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  deleteDoctorSchedule,
  getDoctorSchedules,
  updateDoctorScheduleStatus,
} from "../../services/doctorPortalService";
import { formatDate, formatTime, getStatusLabel } from "../../utils/doctorHelpers";

const FILTERS = ["ALL", "AVAILABLE", "BOOKED", "CANCELLED"];

function getSpecialtyLabel(doctor) {
  return doctor?.specialtyName || "Khám tổng quát";
}

function getLocationLabel(doctor) {
  return doctor?.clinicRoom || "Phòng khám";
}

export function DoctorSchedulesPage() {
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [workDate, setWorkDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  async function loadSchedules({ silent = false, date = workDate } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const result = await getDoctorSchedules(date || undefined);
      setDoctor(result.doctor ?? null);
      setSchedules(result.schedules ?? []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  async function handleDelete(scheduleId) {
    const approved = window.confirm("Xóa khung lịch này?");
    if (!approved) {
      return;
    }

    try {
      setRefreshing(true);
      setError("");
      await deleteDoctorSchedule(scheduleId);
      setSchedules((current) => current.filter((item) => item.id !== scheduleId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(scheduleId, status) {
    try {
      setRefreshing(true);
      setError("");
      const updated = await updateDoctorScheduleStatus(scheduleId, status);
      setSchedules((current) =>
        current.map((item) => (item.id === scheduleId ? updated : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshing(false);
    }
  }

  const filteredSchedules = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      const matchesFilter =
        activeFilter === "ALL" ? true : schedule.status === activeFilter;
      const matchesSearch =
        !keyword ||
        String(schedule.id).includes(keyword) ||
        formatDate(schedule.workDate).toLowerCase().includes(keyword) ||
        getLocationLabel(doctor).toLowerCase().includes(keyword) ||
        getSpecialtyLabel(doctor).toLowerCase().includes(keyword) ||
        doctor?.fullName?.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, doctor, schedules, search]);

  const scheduleStats = useMemo(
    () => [
      {
        label: "Khung giờ còn trống",
        value: schedules.filter((item) => item.status === "AVAILABLE").length,
        tone: "success",
        icon: "event_available",
      },
      {
        label: "Ca đã đặt",
        value: schedules.filter((item) => item.status === "BOOKED").length,
        tone: "primary",
        icon: "calendar_month",
      },
      {
        label: "Ca đã hủy",
        value: schedules.filter((item) => item.status === "CANCELLED").length,
        tone: "danger",
        icon: "event_busy",
      },
    ],
    [schedules],
  );

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Lịch làm việc"
      title="Lịch làm việc"
      description="Quản lý khung giờ khám và trạng thái lịch của bác sĩ."
      actions={
        <Link className="button button--primary" to="/doctor/schedules/create">
          <span className="material-symbols-outlined">add_circle</span>
          <span>Tạo lịch</span>
        </Link>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      <section className="doctor-filter-board">
        <label className="doctor-filter-board__field doctor-filter-board__field--wide">
          <div className="doctor-filter-board__input">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Tìm lịch, chuyên khoa, phòng khám..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>

        <label className="doctor-filter-board__field">
          <input
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
          />
        </label>

        <label className="doctor-filter-board__field">
          <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
            {FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "ALL" ? "Tất cả trạng thái" : getStatusLabel(filter)}
              </option>
            ))}
          </select>
        </label>

        <button
          className="doctor-filter-board__icon-button"
          disabled={refreshing}
          type="button"
          onClick={() => loadSchedules({ silent: true, date: workDate })}
          aria-label="Làm mới lịch"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </section>

      <section className="doctor-mini-stats">
        {scheduleStats.map((item) => (
          <article
            className={`doctor-mini-stat doctor-mini-stat--${item.tone}`}
            key={item.label}
          >
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <span className="material-symbols-outlined">{item.icon}</span>
          </article>
        ))}
      </section>

      <section className="doctor-management-table doctor-management-table--schedules">
        <div className="doctor-management-table__head">
          <span>Ngày</span>
          <span>Khung giờ</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <p className="empty-state">Đang tải lịch làm việc...</p>
        ) : filteredSchedules.length === 0 ? (
          <p className="empty-state">Không tìm thấy khung lịch phù hợp với bộ lọc hiện tại.</p>
        ) : (
          filteredSchedules.map((schedule) => (
            <article className="doctor-management-row" key={schedule.id}>
              <div className="doctor-management-row__slot">
                <strong>{formatDate(schedule.workDate)}</strong>
              </div>

              <div className="doctor-management-row__text">
                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </div>

              <div className="doctor-management-row__status">
                <DoctorStatusBadge status={schedule.status} />
              </div>

              <div className="doctor-management-row__actions">
                <Link
                  className="doctor-icon-action"
                  to={`/doctor/schedules/${schedule.id}/edit`}
                  aria-label="Sửa lịch"
                >
                  <span className="material-symbols-outlined">edit_square</span>
                </Link>

                {schedule.status !== "BOOKED" ? (
                  <button
                    className="doctor-icon-action"
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        schedule.id,
                        schedule.status === "CANCELLED" ? "AVAILABLE" : "CANCELLED",
                      )
                    }
                    aria-label={schedule.status === "CANCELLED" ? "Mở lại khung giờ" : "Hủy khung giờ"}
                  >
                    <span className="material-symbols-outlined">
                      {schedule.status === "CANCELLED" ? "restart_alt" : "block"}
                    </span>
                  </button>
                ) : null}

                <button
                  className="doctor-icon-action doctor-icon-action--danger"
                  type="button"
                  onClick={() => handleDelete(schedule.id)}
                  aria-label="Xóa lịch"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </article>
          ))
        )}

        {!loading && filteredSchedules.length > 0 ? (
          <div className="doctor-management-table__footer">
            <p>
              Hiển thị <strong>{filteredSchedules.length}</strong> khung lịch
            </p>
          </div>
        ) : null}
      </section>

    </DoctorWorkspace>
  );
}
