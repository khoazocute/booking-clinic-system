import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorScheduleForm } from "../../components/doctor/DoctorScheduleForm";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { createDoctorSchedule } from "../../services/doctorPortalService";

export function CreateDoctorSchedulePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    workDate: "",
    startTime: "",
    endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await createDoctorSchedule(form);
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
      title="Tạo lịch làm việc"
      description="Tạo khung lịch mới để bệnh nhân có thể đặt lịch khám."
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        <DoctorScheduleForm
          form={form}
          submitting={submitting}
          submitLabel="Tạo lịch"
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/doctor/schedules")}
        />
      </article>
    </DoctorWorkspace>
  );
}
