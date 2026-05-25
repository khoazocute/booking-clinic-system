import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DoctorScheduleForm } from "../../components/doctor/DoctorScheduleForm";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getDoctorScheduleById,
  updateDoctorSchedule,
} from "../../services/doctorPortalService";

export function EditDoctorSchedulePage() {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const [form, setForm] = useState({
    workDate: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      try {
        const schedule = await getDoctorScheduleById(scheduleId);

        if (!active) {
          return;
        }

        setForm({
          workDate: schedule.workDate || "",
          startTime: String(schedule.startTime || "").slice(0, 5),
          endTime: String(schedule.endTime || "").slice(0, 5),
        });
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

    loadSchedule();

    return () => {
      active = false;
    };
  }, [scheduleId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await updateDoctorSchedule(scheduleId, form);
      navigate("/doctor/schedules");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Lịch làm việc"
      title="Sửa lịch làm việc"
      description="Cập nhật ngày và khung giờ của lịch khám hiện tại."
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {loading ? (
          <p className="empty-state">Đang tải lịch làm việc...</p>
        ) : (
          <DoctorScheduleForm
            form={form}
            submitting={submitting}
            submitLabel="Lưu lịch làm việc"
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/doctor/schedules")}
          />
        )}
      </article>
    </DoctorWorkspace>
  );
}
