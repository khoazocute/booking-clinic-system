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
  return <span className="profile-locked-badge">ÄÃ£ khÃ³a</span>;
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
      setMessage("Cáº­p nháº­t há»“ sÆ¡ thÃ nh cÃ´ng!");
      // Refresh originalData so locks update after first save
      await fetchProfile();
    } catch (err) {
      setError(err.message || "CÃ³ lá»—i xáº£y ra khi cáº­p nháº­t há»“ sÆ¡.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-inner">
          <button
            aria-label="Quay láº¡i"
            className="profile-back-btn"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="profile-title">CÃ i Ä‘áº·t tÃ i khoáº£n</h1>
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
              Há»“ sÆ¡ cÃ¡ nhÃ¢n
            </Link>
            <Link className="profile-nav-link" to="/change-password">
              <span className="material-symbols-outlined">lock</span>
              Äá»•i máº­t kháº©u
            </Link>
            <Link className="profile-nav-link" to="/medical-history">
              <span className="material-symbols-outlined">description</span>
              Tiá»n sá»­ bá»‡nh lÃ½
            </Link>
          </nav>
        </aside>

        <section className="profile-content">
          <div className="profile-section-header">
            <h2>Cáº­p nháº­t há»“ sÆ¡</h2>
            <p>
              Quáº£n lÃ½ thÃ´ng tin cÃ¡ nhÃ¢n vÃ  liÃªn há»‡ cá»§a báº¡n Ä‘á»ƒ chÃºng tÃ´i cÃ³ thá»ƒ phá»¥c vá»¥ tá»‘t nháº¥t.
            </p>
          </div>

          {message && <div className="msg-success">{message}</div>}
          {error && <div className="msg-error">{error}</div>}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-soft)" }}>
              Äang táº£i dá»¯ liá»‡u...
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-group">
                <h3 className="profile-group-title">ThÃ´ng tin cÆ¡ báº£n</h3>

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
                      aria-label="Thay Ä‘á»•i áº£nh Ä‘áº¡i diá»‡n"
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

                <div className="profile-field">
                  <label>Äá»‹a chá»‰ Email</label>
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

                <div className="profile-field">
                  <label>
                    Há» vÃ  tÃªn
                    {!!originalData.fullName && <LockedBadge />}
                  </label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">person</span>
                    <input
                      className="profile-input"
                      placeholder="Nháº­p há» vÃ  tÃªn"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!!originalData.fullName}
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label>Sá»‘ Ä‘iá»‡n thoáº¡i</label>
                  <div className="profile-input-wrap">
                    <span className="material-symbols-outlined">call</span>
                    <input
                      className="profile-input"
                      placeholder="Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i"
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-group">
                <h3 className="profile-group-title">Y táº¿ & Báº£o hiá»ƒm</h3>

                <div className="profile-grid-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>

                    <div className="profile-field">
                      <label>
                        NgÃ y sinh
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

                    <div className="profile-field">
                      <label>
                        CCCD / CMND
                        {!!originalData.identityNumber && <LockedBadge />}
                      </label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">badge</span>
                        <input
                          className="profile-input"
                          placeholder="Nháº­p sá»‘ CCCD"
                          type="text"
                          name="identityNumber"
                          value={formData.identityNumber}
                          onChange={handleChange}
                          disabled={!!originalData.identityNumber}
                        />
                      </div>
                    </div>

                    <div className="profile-field">
                      <label>
                        MÃ£ tháº» BHYT
                        {!!originalData.insuranceNumber && <LockedBadge />}
                      </label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">health_and_safety</span>
                        <input
                          className="profile-input"
                          placeholder="Nháº­p mÃ£ báº£o hiá»ƒm y táº¿"
                          type="text"
                          name="insuranceNumber"
                          value={formData.insuranceNumber}
                          onChange={handleChange}
                          disabled={!!originalData.insuranceNumber}
                        />
                      </div>
                    </div>

                    <div className="profile-field">
                      <label>Giá»›i tÃ­nh</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">wc</span>
                        <select
                          className="profile-select"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Ná»¯</option>
                          <option value="other">KhÃ¡c</option>
                        </select>
                        <span className="material-symbols-outlined icon-right">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                    <div className="profile-field">
                      <label>NhÃ³m mÃ¡u</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">bloodtype</span>
                        <select
                          className="profile-select"
                          name="bloodType"
                          value={formData.bloodType}
                          onChange={handleChange}
                        >
                          <option value="unknown">ChÆ°a rÃµ</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                        <span className="material-symbols-outlined icon-right">expand_more</span>
                      </div>
                    </div>

                    <div className="profile-field profile-field-error">
                      <label>LiÃªn há»‡ kháº©n cáº¥p</label>
                      <div className="profile-input-wrap">
                        <span className="material-symbols-outlined">warning</span>
                        <input
                          className="profile-input"
                          placeholder="TÃªn vÃ  Sá»‘ Ä‘iá»‡n thoáº¡i ngÆ°á»i thÃ¢n"
                          type="text"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-field" style={{ marginTop: "var(--space-sm)" }}>
                  <label>Äá»‹a chá»‰ hiá»‡n táº¡i</label>
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

                <div className="profile-field">
                  <label>Ghi chÃº y táº¿ (Dá»‹ á»©ng, bá»‡nh lÃ½ ná»n...)</label>
                  <textarea
                    className="profile-textarea"
                    placeholder="Nháº­p cÃ¡c thÃ´ng tin y táº¿ quan trá»ng cáº§n lÆ°u Ã½..."
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
                  Há»§y
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Äang lÆ°u..." : "LÆ°u thay Ä‘á»•i"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
