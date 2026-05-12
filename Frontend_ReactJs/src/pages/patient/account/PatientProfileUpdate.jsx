import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPatientProfile, updatePatientProfile } from "../../../services/patientService";
import "./PatientProfileUpdate.css";

const EMPTY_FORM = {
  email: "",
  fullName: "",
  phoneNumber: "",
  dateOfBirth: "",
  identityNumber: "",
  insuranceNumber: "",
  gender: "male",
  bloodType: "unknown",
  emergencyContactPhone: "",
  address: "",
  medicalHistoryNote: "",
};

function LockedBadge() {
  return <span className="profile-locked-badge">Đã khóa</span>;
}

export function PatientProfileUpdate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [originalData, setOriginalData] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getPatientProfile();
      const p = res?.data;
      if (p) {
        const mapped = {
          email:                 p.email || "",
          fullName:              p.fullName || "",
          phoneNumber:           p.phone || "",
          dateOfBirth:           p.dateOfBirth || "",
          identityNumber:        p.identityNumber || "",
          insuranceNumber:       p.insuranceNumber || "",
          gender:                p.gender || "male",
          bloodType:             p.bloodType || "unknown",
          emergencyContactPhone: p.emergencyContactPhone || "",
          address:               p.address || "",
          medicalHistoryNote:    p.medicalHistoryNote || "",
        };
        setFormData(mapped);
        setOriginalData(mapped);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { phoneNumber, ...rest } = formData;
      await updatePatientProfile({
        ...rest,
        phone: phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
      });
      setMessage("Cập nhật hồ sơ thành công!");
      // Refresh originalData so locks update after first save
      await fetchProfile();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-inner">
          <button
            aria-label="Quay lại"
            className="profile-back-btn"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="profile-title">Cài đặt tài khoản</h1>
        </div>
      </header>

      <main className="profile-main">
        <aside className="profile-sidebar">
          <nav className="profile-nav">
            <Link className="profile-nav-link active" to="/profile">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person
              </span>
              Hồ sơ cá nhân
            </Link>
            <Link className="profile-nav-link" to="/change-password">
              <span className="material-symbols-outlined">lock</span>
              Đổi mật khẩu
            </Link>
            <Link className="profile-nav-link" to="/medical-history">
              <span className="material-symbols-outlined">description</span>
              Tiền sử bệnh lý
            </Link>
          </nav>
        </aside>

        <section className="profile-content">
          <div className="profile-section-header">
            <h2>Cập nhật hồ sơ</h2>
            <p>
              Quản lý thông tin cá nhân và liên hệ của bạn để chúng tôi có thể phục vụ tốt nhất.
            </p>
          </div>

          {message && <div className="msg-success">{message}</div>}
          {error && <div className="msg-error">{error}</div>}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-soft)" }}>
              Đang tải dữ liệu...
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-group">
                <h3 className="profile-group-title">Thông tin cơ bản</h3>

                <div className="profile-avatar-wrap">
                  <div className="profile-avatar">
                    <div
                      className="profile-avatar-img"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXWxE5waWAcHFI4NmgzYZIxbfuNrPtts9T5o8MSx9-ZD6CNqx1abPKEVcWFgTcTWrbhI0qk--PPzv8FNrFUWuUeyjCub4hOd2O7k6BuQKScoWWEK7zKWyaOrWR9KwRuRuV-jg3rHTjSc4k1WgxL0IPcxGaZb6mPrLVHllD_Qpf9pbJq13iuHvswOaBN55sxFe3vZ55Lqha5YsKDmKM3SXVfZ4aR-3gFkm07iEbTSAlTPBk7bTB0VHRkmCNsc4P2GhomFl1aklVsg8')",
                      }}
                    />
                    <button
                      aria-label="Thay đổi ảnh đại diện"
                      className="profile-avatar-btn"
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                      >
                        photo_camera
                      </span>
                    </button>
                  </div>
                </div>

                {/* Email — always locked */}
                <div className="profile-field">
                  <label>Địa chỉ Email</label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      className="profile-input"
                      disabled
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Họ và tên — core locked */}
                <div className="profile-field">
                  <label>
                    Họ và tên
                    {!!originalData.fullName && <LockedBadge />}
                  </label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">person</span>
                    <input
                      className="profile-input"
                      placeholder="Nhập họ và tên"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!!originalData.fullName}
                    />
                  </div>
                </div>

                {/* Số điện thoại — always editable */}
                <div className="profile-field">
                  <label>Số điện thoại</label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">call</span>
                    <input
                      className="profile-input"
                      placeholder="Nhập số điện thoại"
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-group">
                <h3 className="profile-group-title">Y tế & Bảo hiểm</h3>

                <div className="profile-grid-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>

                    {/* Ngày sinh — core locked */}
                    <div className="profile-field">
                      <label>
                        Ngày sinh
                        {!!originalData.dateOfBirth && <LockedBadge />}
                      </label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <input
                          className="profile-input"
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          disabled={!!originalData.dateOfBirth}
                        />
                      </div>
                    </div>

                    {/* CCCD — core locked */}
                    <div className="profile-field">
                      <label>
                        CCCD / CMND
                        {!!originalData.identityNumber && <LockedBadge />}
                      </label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">badge</span>
                        <input
                          className="profile-input"
                          placeholder="Nhập số CCCD"
                          type="text"
                          name="identityNumber"
                          value={formData.identityNumber}
                          onChange={handleChange}
                          disabled={!!originalData.identityNumber}
                        />
                      </div>
                    </div>

                    {/* BHYT — core locked */}
                    <div className="profile-field">
                      <label>
                        Mã thẻ BHYT
                        {!!originalData.insuranceNumber && <LockedBadge />}
                      </label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">health_and_safety</span>
                        <input
                          className="profile-input"
                          placeholder="Nhập mã bảo hiểm y tế"
                          type="text"
                          name="insuranceNumber"
                          value={formData.insuranceNumber}
                          onChange={handleChange}
                          disabled={!!originalData.insuranceNumber}
                        />
                      </div>
                    </div>

                    {/* Giới tính — always editable */}
                    <div className="profile-field">
                      <label>Giới tính</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">wc</span>
                        <select
                          className="profile-select"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                        <span className="material-symbols-outlined icon-right">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                    {/* Nhóm máu — always editable */}
                    <div className="profile-field">
                      <label>Nhóm máu</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">bloodtype</span>
                        <select
                          className="profile-select"
                          name="bloodType"
                          value={formData.bloodType}
                          onChange={handleChange}
                        >
                          <option value="unknown">Chưa rõ</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                        <span className="material-symbols-outlined icon-right">expand_more</span>
                      </div>
                    </div>

                    {/* Liên hệ khẩn cấp — always editable */}
                    <div className="profile-field profile-field-error">
                      <label>Liên hệ khẩn cấp</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">warning</span>
                        <input
                          className="profile-input"
                          placeholder="Tên và Số điện thoại người thân"
                          type="text"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ — always editable */}
                <div className="profile-field" style={{ marginTop: "var(--space-sm)" }}>
                  <label>Địa chỉ hiện tại</label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">location_on</span>
                    <input
                      className="profile-input"
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Ghi chú y tế — always editable */}
                <div className="profile-field">
                  <label>Ghi chú y tế (Dị ứng, bệnh lý nền...)</label>
                  <textarea
                    className="profile-textarea"
                    placeholder="Nhập các thông tin y tế quan trọng cần lưu ý..."
                    name="medicalHistoryNote"
                    value={formData.medicalHistoryNote}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="profile-footer">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
