import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../../services/patientService";

const GENDER_OPTIONS = [
  { value: "", label: "-- Chọn giới tính --" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const BLOOD_OPTIONS = [
  { value: "", label: "-- Chọn nhóm máu --" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const EMPTY = {
  dateOfBirth: "",
  gender: "",
  address: "",
  bloodType: "",
  identityNumber: "",
  insuranceNumber: "",
  emergencyContactPhone: "",
  medicalHistoryNote: "",
};

export function PatientProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const p = res?.data ?? res;
        if (p) {
          setForm({
            dateOfBirth: p.dateOfBirth ?? "",
            gender: p.gender ?? "",
            address: p.address ?? "",
            bloodType: p.bloodType ?? "",
            identityNumber: p.identityNumber ?? "",
            insuranceNumber: p.insuranceNumber ?? "",
            emergencyContactPhone: p.emergencyContactPhone ?? "",
            medicalHistoryNote: p.medicalHistoryNote ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await updateMyProfile({
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
        bloodType: form.bloodType || null,
        identityNumber: form.identityNumber || null,
        insuranceNumber: form.insuranceNumber || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        medicalHistoryNote: form.medicalHistoryNote || null,
      });
      setSuccess(true);
      if (returnTo) {
        setTimeout(() => navigate(returnTo), 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state"><p>Đang tải...</p></div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="mc-container" style={{ maxWidth: 720, padding: "48px 0 80px" }}>
        <div className="mc-section-card">
          <div className="mc-section-heading">
            <h2>Hồ sơ bệnh nhân</h2>
          </div>
          <p style={{ margin: "0 0 24px", color: "var(--text-soft)", fontSize: "15px" }}>
            Hoàn thiện hồ sơ để có thể đặt lịch khám. Tất cả các trường đều không bắt buộc.
          </p>

          {success && (
            <div className="mc-profile-alert mc-profile-alert--success">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Hồ sơ đã được lưu thành công!{returnTo && " Đang chuyển hướng..."}
            </div>
          )}

          {error && (
            <div className="mc-profile-alert mc-profile-alert--error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mc-profile-form">
            <div className="mc-profile-row">
              <div className="mc-profile-field">
                <label htmlFor="dateOfBirth">Ngày sinh</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div className="mc-profile-field">
                <label htmlFor="gender">Giới tính</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mc-profile-row">
              <div className="mc-profile-field">
                <label htmlFor="bloodType">Nhóm máu</label>
                <select id="bloodType" name="bloodType" value={form.bloodType} onChange={handleChange}>
                  {BLOOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="mc-profile-field">
                <label htmlFor="emergencyContactPhone">SĐT người thân (khẩn cấp)</label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  placeholder="0912 345 678"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mc-profile-field mc-profile-field--full">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="mc-profile-row">
              <div className="mc-profile-field">
                <label htmlFor="identityNumber">Số CCCD / CMND</label>
                <input
                  id="identityNumber"
                  name="identityNumber"
                  type="text"
                  placeholder="012345678901"
                  value={form.identityNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="mc-profile-field">
                <label htmlFor="insuranceNumber">Số bảo hiểm y tế</label>
                <input
                  id="insuranceNumber"
                  name="insuranceNumber"
                  type="text"
                  placeholder="HS4012345678901"
                  value={form.insuranceNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mc-profile-field mc-profile-field--full">
              <label htmlFor="medicalHistoryNote">Tiền sử bệnh</label>
              <textarea
                id="medicalHistoryNote"
                name="medicalHistoryNote"
                rows={4}
                placeholder="Dị ứng thuốc, bệnh mãn tính, phẫu thuật trước đây... (nếu có)"
                value={form.medicalHistoryNote}
                onChange={handleChange}
              />
            </div>

            <div className="mc-profile-actions">
              <button className="mc-confirm-btn" type="submit" disabled={submitting}
                style={{ width: "auto", padding: "0 40px" }}>
                {submitting ? "Đang lưu..." : "Lưu hồ sơ"}
              </button>
              {returnTo && (
                <button type="button" className="mc-btn mc-btn--outline"
                  onClick={() => navigate(returnTo)}>
                  Bỏ qua
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
