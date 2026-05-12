import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentDoctorProfile,
  getSpecialties,
  updateCurrentDoctorProfile,
} from "../../services/doctorPortalService";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";

function getInitials(name) {
  if (!name) {
    return "DR";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EditDoctorProfilePage() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState({
    specialtyId: "",
    experienceYears: "",
    qualification: "",
    biography: "",
    clinicRoom: "",
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [doctorProfile, specialtyItems] = await Promise.all([
          getCurrentDoctorProfile(),
          getSpecialties(),
        ]);

        if (!active) {
          return;
        }

        setDoctor(doctorProfile);
        setForm({
          specialtyId: doctorProfile.specialtyId ? String(doctorProfile.specialtyId) : "",
          experienceYears: doctorProfile.experienceYears
            ? String(doctorProfile.experienceYears)
            : "",
          qualification: doctorProfile.qualification || "",
          biography: doctorProfile.biography || "",
          clinicRoom: doctorProfile.clinicRoom || "",
        });
        setSpecialties(specialtyItems);
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

    loadData();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await updateCurrentDoctorProfile({
        specialtyId: form.specialtyId ? Number(form.specialtyId) : null,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
        qualification: form.qualification,
        biography: form.biography,
        clinicRoom: form.clinicRoom,
      });

      navigate("/doctor/profile");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Profile"
      title="Edit Doctor Profile"
      description="Manage professional credentials, specialty information, and clinic presentation."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/profile">
            Cancel
          </Link>
          <button
            className="button button--primary"
            disabled={loading || saving}
            form="doctor-profile-form"
            type="submit"
          >
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      {loading ? (
        <p className="empty-state">Loading profile form...</p>
      ) : (
        <form
          className="doctor-profile-editor"
          id="doctor-profile-form"
          onSubmit={handleSubmit}
        >
          <section className="doctor-profile-editor__sidebar">
            <article className="doctor-panel doctor-profile-card">
              <div className="doctor-profile-card__avatar">
                {getInitials(doctor?.fullName)}
              </div>
              <h2>{doctor?.fullName || "Doctor"}</h2>
              <p>{doctor?.email || "Secure doctor account"}</p>

              <div className="doctor-profile-card__meta">
                <div>
                  <span>Full Name</span>
                  <strong>{doctor?.fullName || "--"}</strong>
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{doctor?.email || "--"}</strong>
                </div>
                <div>
                  <span>Current Room</span>
                  <strong>{doctor?.clinicRoom || "Not assigned"}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-panel doctor-identity-card">
              <div className="doctor-panel__head">
                <div>
                  <h2>Identity</h2>
                  <p>Read-only account information from the current doctor record.</p>
                </div>
              </div>

              <div className="doctor-identity-card__grid">
                <div>
                  <span>Doctor ID</span>
                  <strong>{doctor?.id ? `DR-${String(doctor.id).padStart(4, "0")}` : "--"}</strong>
                </div>
                <div>
                  <span>User ID</span>
                  <strong>{doctor?.userId || "--"}</strong>
                </div>
                <div>
                  <span>Consultation Fee</span>
                  <strong>
                    {doctor?.consultationFee
                      ? `${Number(doctor.consultationFee).toLocaleString("vi-VN")} VND`
                      : "--"}
                  </strong>
                </div>
              </div>
            </article>
          </section>

          <section className="doctor-profile-editor__content">
            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Professional Information</h2>
                  <p>Update the details patients see when browsing your public profile.</p>
                </div>
              </div>

              <div className="doctor-form doctor-form--editor">
                <div className="doctor-form__grid">
                  <label>
                    <span>Specialty</span>
                    <select name="specialtyId" value={form.specialtyId} onChange={handleChange}>
                      <option value="">Select specialty</option>
                      {specialties.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Experience (years)</span>
                    <input
                      name="experienceYears"
                      type="number"
                      value={form.experienceYears}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="doctor-form__grid">
                  <label>
                    <span>Qualification</span>
                    <input
                      name="qualification"
                      type="text"
                      value={form.qualification}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    <span>Clinic room</span>
                    <input
                      name="clinicRoom"
                      type="text"
                      value={form.clinicRoom}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label>
                  <span>Biography</span>
                  <textarea
                    name="biography"
                    rows={6}
                    value={form.biography}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </article>

            <article className="doctor-panel doctor-profile-editor__helper">
              <div className="doctor-panel__head">
                <div>
                  <h2>Clinic Operations</h2>
                  <p>
                    Shift availability is managed from the schedule board so profile edits stay
                    focused on public-facing information.
                  </p>
                </div>
                <Link className="button button--secondary" to="/doctor/schedules">
                  Manage Schedules
                </Link>
              </div>

              <div className="doctor-editor-note">
                <span className="material-symbols-outlined">schedule</span>
                <div>
                  <strong>Need to adjust clinic hours?</strong>
                  <p>
                    Use the schedule module to open, cancel, or re-activate time slots without
                    affecting your base profile data.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </form>
      )}
    </DoctorWorkspace>
  );
}
