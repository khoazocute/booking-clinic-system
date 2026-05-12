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
      title="Create medical record"
      description="Nhap thong tin kham benh theo dung payload backend."
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        <form className="doctor-form" onSubmit={handleSubmit}>
          <div className="doctor-form__grid doctor-form__grid--single">
            <label>
              <span>Symptoms</span>
              <textarea
                required
                name="symptoms"
                rows={4}
                value={form.symptoms}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Diagnosis</span>
              <textarea
                required
                name="diagnosis"
                rows={3}
                value={form.diagnosis}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Treatment plan</span>
              <textarea
                required
                name="treatmentPlan"
                rows={3}
                value={form.treatmentPlan}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Notes</span>
              <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
            </label>
            <label>
              <span>Follow up date</span>
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
              Back
            </Link>
            <button className="button button--primary" disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Save medical record"}
            </button>
          </div>
        </form>
      </article>
    </DoctorWorkspace>
  );
}
