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
      title="Chinh sua ho so bac si"
      description="Cap nhat chuyen khoa, kinh nghiem, bang cap va thong tin phong kham."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/profile">
            Huy
          </Link>
          <button
            className="button button--primary"
            disabled={loading || saving}
            form="doctor-profile-form"
            type="submit"
          >
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? "Dang luu..." : "Luu thay doi"}</span>
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
                  <span>Email Address</span>
                  <strong>{doctor?.email || "--"}</strong>
                </div>
                <div>
                  <span>Current Room</span>
                  <strong>{doctor?.clinicRoom || "Not assigned"}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="doctor-profile-editor__content">
            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Thong tin chuyen mon</h2>
                  <p>Thong tin nay se hien thi tren ho so cong khai cua bac si.</p>
                </div>
              </div>

              <div className="doctor-form doctor-form--editor">
                <div className="doctor-form__grid">
                  <label>
                    <span>Chuyen khoa</span>
                    <select name="specialtyId" value={form.specialtyId} onChange={handleChange}>
                      <option value="">Chon chuyen khoa</option>
                      {specialties.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Kinh nghiem (nam)</span>
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
                    <span>Bang cap</span>
                    <input
                      name="qualification"
                      type="text"
                      value={form.qualification}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    <span>Phong kham</span>
                    <input
                      name="clinicRoom"
                      type="text"
                      value={form.clinicRoom}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label>
                  <span>Gioi thieu</span>
                  <textarea
                    name="biography"
                    rows={6}
                    value={form.biography}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </article>
          </section>
        </form>
      )}
    </DoctorWorkspace>
  );
}
