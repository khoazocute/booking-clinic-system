import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorStatusBadge } from "../../components/doctor/DoctorStatusBadge";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  deleteDoctorSchedule,
  getDoctorSchedules,
  updateDoctorScheduleStatus,
} from "../../services/doctorPortalService";
import { formatDate, formatTime } from "../../utils/doctorHelpers";

const FILTERS = ["ALL", "AVAILABLE", "BOOKED", "CANCELLED"];

function getSpecialtyLabel(doctor) {
  return doctor?.specialtyName || "General Practice";
}

function getLocationLabel(doctor) {
  return doctor?.clinicRoom || "Clinic Room";
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
    const approved = window.confirm("Delete this schedule slot?");
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
        label: "Available Slots Today",
        value: schedules.filter((item) => item.status === "AVAILABLE").length,
        tone: "success",
        icon: "event_available",
      },
      {
        label: "Booked Shifts",
        value: schedules.filter((item) => item.status === "BOOKED").length,
        tone: "primary",
        icon: "calendar_month",
      },
      {
        label: "Cancellations",
        value: schedules.filter((item) => item.status === "CANCELLED").length,
        tone: "danger",
        icon: "event_busy",
      },
    ],
    [schedules],
  );

  return (
    <DoctorWorkspace
      eyebrow="Schedules"
      title="Doctor Schedules"
      description="Manage and monitor clinical shifts, slot availability, and appointment readiness."
      actions={
        <Link className="button button--primary" to="/doctor/schedules/create">
          <span className="material-symbols-outlined">add_circle</span>
          <span>Create Schedule</span>
        </Link>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      <section className="doctor-filter-board">
        <label className="doctor-filter-board__field doctor-filter-board__field--wide">
          <span>Search schedule</span>
          <div className="doctor-filter-board__input">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Search schedules, specialty, location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>

        <label className="doctor-filter-board__field">
          <span>Work date</span>
          <input
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
          />
        </label>

        <label className="doctor-filter-board__field">
          <span>Status</span>
          <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
            {FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "ALL" ? "All Statuses" : filter}
              </option>
            ))}
          </select>
        </label>

        <button
          className="doctor-filter-board__icon-button"
          disabled={refreshing}
          type="button"
          onClick={() => loadSchedules({ silent: true, date: workDate })}
          aria-label="Refresh schedules"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </section>

      <section className="doctor-management-table">
        <div className="doctor-management-table__head">
          <span>Doctor</span>
          <span>Specialty</span>
          <span>Time Slot</span>
          <span>Location</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <p className="empty-state">Loading schedules...</p>
        ) : filteredSchedules.length === 0 ? (
          <p className="empty-state">No schedule slots found for the current filters.</p>
        ) : (
          filteredSchedules.map((schedule) => (
            <article className="doctor-management-row" key={schedule.id}>
              <div className="doctor-management-row__doctor">
                <div className="doctor-management-row__avatar">
                  {(doctor?.fullName || "DR")
                    .split(" ")
                    .slice(0, 2)
                    .map((item) => item[0] || "")
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <strong>{doctor?.fullName || "Current Doctor"}</strong>
                  <span>ID: DR-{String(doctor?.id ?? schedule.id).padStart(4, "0")}</span>
                </div>
              </div>

              <div className="doctor-management-row__text">{getSpecialtyLabel(doctor)}</div>

              <div className="doctor-management-row__slot">
                <strong>{formatDate(schedule.workDate)}</strong>
                <span>
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </span>
              </div>

              <div className="doctor-management-row__text">{getLocationLabel(doctor)}</div>

              <div className="doctor-management-row__status">
                <DoctorStatusBadge status={schedule.status} />
              </div>

              <div className="doctor-management-row__actions">
                <Link
                  className="doctor-icon-action"
                  to={`/doctor/schedules/${schedule.id}/edit`}
                  aria-label="Edit schedule"
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
                    aria-label={schedule.status === "CANCELLED" ? "Re-open slot" : "Cancel slot"}
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
                  aria-label="Delete schedule"
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
              Showing <strong>{filteredSchedules.length}</strong> slot
              {filteredSchedules.length > 1 ? "s" : ""}
            </p>
          </div>
        ) : null}
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
    </DoctorWorkspace>
  );
}
