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
      eyebrow="Bác sĩ / Hồ sơ"
      title="Chỉnh sửa hồ sơ bác sĩ"
      description="Cập nhật chuyên khoa, kinh nghiệm, bằng cấp và thông tin phòng khám."
      actions={
        <>
          <Link className="button button--secondary" to="/doctor/profile">
            Hủy
          </Link>
          <button
            className="button button--primary"
            disabled={loading || saving}
            form="doctor-profile-form"
            type="submit"
          >
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      {loading ? (
        <p className="empty-state">Đang tải biểu mẫu hồ sơ...</p>
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
              <h2>{doctor?.fullName || "Bác sĩ"}</h2>
              <p>{doctor?.email || "Tài khoản bác sĩ bảo mật"}</p>

              <div className="doctor-profile-card__meta">
                <div>
                  <span>Email</span>
                  <strong>{doctor?.email || "--"}</strong>
                </div>
                <div>
                  <span>Phòng hiện tại</span>
                  <strong>{doctor?.clinicRoom || "Chưa phân phòng"}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="doctor-profile-editor__content">
            <article className="doctor-panel">
              <div className="doctor-panel__head">
                <div>
                  <h2>Thông tin chuyên môn</h2>
                  <p>Thông tin này sẽ hiển thị trên hồ sơ công khai của bác sĩ.</p>
                </div>
              </div>

              <div className="doctor-form doctor-form--editor">
                <div className="doctor-form__grid">
                  <label>
                    <span>Chuyên khoa</span>
                    <select name="specialtyId" value={form.specialtyId} onChange={handleChange}>
                      <option value="">Chọn chuyên khoa</option>
                      {specialties.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Kinh nghiệm (năm)</span>
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
                    <span>Bằng cấp</span>
                    <input
                      name="qualification"
                      type="text"
                      value={form.qualification}
                      disabled
                    />
                    <small>Trình độ chuyên môn do quản trị viên xác minh và cập nhật.</small>
                  </label>

                  <label>
                    <span>Phòng khám</span>
                    <input
                      name="clinicRoom"
                      type="text"
                      value={form.clinicRoom}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label>
                  <span>Giới thiệu</span>
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
