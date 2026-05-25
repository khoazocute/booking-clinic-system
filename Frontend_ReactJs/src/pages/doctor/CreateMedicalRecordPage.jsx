import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { createMedicalRecord } from "../../services/doctorPortalService";

export function CreateMedicalRecordPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [form, setForm] = useState({
    symptoms: "",
    diagnosis: "",
    treatmentPlan: "",
    notes: "",
    followUpDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!appointmentId) {
      setError("Cần chọn một lịch hẹn trước khi tạo hồ sơ khám.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createMedicalRecord({
        appointmentId: Number(appointmentId),
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        treatmentPlan: form.treatmentPlan,
        notes: form.notes,
        followUpDate: form.followUpDate || null,
      });

      navigate(`/doctor/medical-records/${response.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Bác sĩ / Hồ sơ khám"
      title="Tạo hồ sơ khám"
      description="Nhập thông tin khám bệnh cho lịch hẹn đã chọn."
      actions={
        <Link className="button button--secondary" to="/doctor/appointments">
          Quay lại lịch hẹn
        </Link>
      }
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {!appointmentId ? (
          <div className="doctor-empty-guide">
            <span className="material-symbols-outlined">assignment</span>
            <h2>Chưa chọn lịch hẹn</h2>
            <p>Hồ sơ khám cần được tạo từ một lịch hẹn cụ thể.</p>
            <Link className="button button--primary" to="/doctor/appointments">
              Chọn lịch hẹn
            </Link>
          </div>
        ) : (
        <form className="doctor-form" onSubmit={handleSubmit}>
          <div className="doctor-form__grid doctor-form__grid--single">
            <label>
              <span>Triệu chứng</span>
              <textarea
                required
                name="symptoms"
                rows={4}
                value={form.symptoms}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Chẩn đoán</span>
              <textarea
                required
                name="diagnosis"
                rows={3}
                value={form.diagnosis}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Hướng điều trị</span>
              <textarea
                required
                name="treatmentPlan"
                rows={3}
                value={form.treatmentPlan}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Ghi chú</span>
              <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
            </label>
            <label>
              <span>Ngày tái khám</span>
              <input
                name="followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <p className="muted-text">
            Lưu ý: backend chỉ cho tạo hồ sơ khám khi lịch hẹn đang ở
            trạng thái <strong>Đã xác nhận</strong>.
          </p>

          <div className="doctor-form__actions">
            <Link className="button button--secondary" to={`/doctor/appointments/${appointmentId}`}>
              Quay lại
            </Link>
            <button className="button button--primary" disabled={submitting} type="submit">
              {submitting ? "Đang lưu..." : "Lưu hồ sơ khám"}
            </button>
          </div>
        </form>
        )}
      </article>
    </DoctorWorkspace>
  );
}
