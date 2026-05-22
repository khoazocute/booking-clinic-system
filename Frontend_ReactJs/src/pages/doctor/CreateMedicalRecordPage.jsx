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
      setError("Can chon mot lich hen truoc khi tao ho so kham.");
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
      eyebrow="Doctor / Medical Record"
      title="Tao ho so kham"
      description="Nhap thong tin kham benh cho lich hen da chon."
      actions={
        <Link className="button button--secondary" to="/doctor/appointments">
          Quay lai lich hen
        </Link>
      }
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {!appointmentId ? (
          <div className="doctor-empty-guide">
            <span className="material-symbols-outlined">assignment</span>
            <h2>Chua chon lich hen</h2>
            <p>Ho so kham can duoc tao tu mot lich hen cu the.</p>
            <Link className="button button--primary" to="/doctor/appointments">
              Chon lich hen
            </Link>
          </div>
        ) : (
        <form className="doctor-form" onSubmit={handleSubmit}>
          <div className="doctor-form__grid doctor-form__grid--single">
            <label>
              <span>Trieu chung</span>
              <textarea
                required
                name="symptoms"
                rows={4}
                value={form.symptoms}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Chan doan</span>
              <textarea
                required
                name="diagnosis"
                rows={3}
                value={form.diagnosis}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Huong dieu tri</span>
              <textarea
                required
                name="treatmentPlan"
                rows={3}
                value={form.treatmentPlan}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Ghi chu</span>
              <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
            </label>
            <label>
              <span>Ngay tai kham</span>
              <input
                name="followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <p className="muted-text">
            Luu y: backend chi cho tao medical record khi appointment dang o
            trang thai <strong>CONFIRMED</strong>.
          </p>

          <div className="doctor-form__actions">
            <Link className="button button--secondary" to={`/doctor/appointments/${appointmentId}`}>
              Quay lai
            </Link>
            <button className="button button--primary" disabled={submitting} type="submit">
              {submitting ? "Dang luu..." : "Luu ho so kham"}
            </button>
          </div>
        </form>
        )}
      </article>
    </DoctorWorkspace>
  );
}
