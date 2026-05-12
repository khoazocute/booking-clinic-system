import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createPrescription,
  getMedicines,
} from "../../services/doctorPortalService";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";

function createEmptyItem() {
  return {
    medicineId: "",
    dosePerTime: "1",
    timesPerDay: "1",
    durationDays: "1",
    dosageText: "",
    instruction: "",
    note: "",
  };
}

export function CreatePrescriptionPage() {
  const navigate = useNavigate();
  const { medicalRecordId } = useParams();
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    generalNote: "",
    items: [createEmptyItem()],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMedicines() {
      try {
        const items = await getMedicines();
        if (active) {
          setMedicines(items);
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

    loadMedicines();

    return () => {
      active = false;
    };
  }, []);

  function handleItemChange(index, field, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItemRow() {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  }

  function removeItemRow(index) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await createPrescription({
        medicalRecordId: Number(medicalRecordId),
        generalNote: form.generalNote,
        items: form.items.map((item) => ({
          medicineId: Number(item.medicineId),
          dosePerTime: Number(item.dosePerTime),
          timesPerDay: Number(item.timesPerDay),
          durationDays: Number(item.durationDays),
          dosageText: item.dosageText,
          instruction: item.instruction,
          note: item.note,
        })),
      });

      navigate(`/doctor/prescriptions/${response.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Prescription"
      title="Create prescription"
      description="Nhap don thuoc theo dung payload backend va chon medicine that."
    >
      <article className="doctor-panel">
        {error ? <p className="empty-state">{error}</p> : null}
        {loading ? (
          <p className="empty-state">Loading medicines...</p>
        ) : (
          <form className="doctor-form" onSubmit={handleSubmit}>
            <label>
              <span>General note</span>
              <textarea
                name="generalNote"
                rows={3}
                value={form.generalNote}
                onChange={(event) =>
                  setForm((current) => ({ ...current, generalNote: event.target.value }))
                }
              />
            </label>

            <div className="doctor-prescription-builder">
              {form.items.map((item, index) => (
                <div className="doctor-prescription-row" key={`item-${index}`}>
                  <label>
                    <span>Medicine</span>
                    <select
                      required
                      value={item.medicineId}
                      onChange={(event) => handleItemChange(index, "medicineId", event.target.value)}
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Dose per time</span>
                    <input
                      min="1"
                      required
                      type="number"
                      value={item.dosePerTime}
                      onChange={(event) => handleItemChange(index, "dosePerTime", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Times per day</span>
                    <input
                      min="1"
                      required
                      type="number"
                      value={item.timesPerDay}
                      onChange={(event) => handleItemChange(index, "timesPerDay", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Duration days</span>
                    <input
                      min="1"
                      required
                      type="number"
                      value={item.durationDays}
                      onChange={(event) => handleItemChange(index, "durationDays", event.target.value)}
                    />
                  </label>
                  <label className="doctor-prescription-row__wide">
                    <span>Dosage text</span>
                    <input
                      type="text"
                      value={item.dosageText}
                      onChange={(event) => handleItemChange(index, "dosageText", event.target.value)}
                    />
                  </label>
                  <label className="doctor-prescription-row__wide">
                    <span>Instruction</span>
                    <input
                      type="text"
                      value={item.instruction}
                      onChange={(event) => handleItemChange(index, "instruction", event.target.value)}
                    />
                  </label>
                  <label className="doctor-prescription-row__wide">
                    <span>Note</span>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(event) => handleItemChange(index, "note", event.target.value)}
                    />
                  </label>
                  {form.items.length > 1 ? (
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => removeItemRow(index)}
                    >
                      Remove row
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="muted-text">
              Luu y: backend chi cho tao prescription khi appointment da chuyen
              sang <strong>COMPLETED</strong> va moi medical record chi co 1 don thuoc.
            </p>

            <div className="doctor-form__actions">
              <button className="button button--secondary" type="button" onClick={addItemRow}>
                Add medicine row
              </button>
              <Link className="button button--secondary" to={`/doctor/medical-records/${medicalRecordId}`}>
                Back
              </Link>
              <button className="button button--primary" disabled={submitting} type="submit">
                {submitting ? "Saving..." : "Save prescription"}
              </button>
            </div>
          </form>
        )}
      </article>
    </DoctorWorkspace>
  );
}
