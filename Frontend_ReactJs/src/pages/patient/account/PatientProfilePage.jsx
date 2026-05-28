import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SafeAvatar } from "../../../components/common/SafeAvatar";
import { getPatientProfile } from "../../../services/patientService";
import "./PatientProfilePage.css";

const GENDER_LABEL = { male: "Nam", female: "Nữ", other: "Khác" };
const BLOOD_LABEL = { unknown: "Chưa rõ", A: "A", B: "B", AB: "AB", O: "O" };

function val(v) {
  return v && String(v).trim() ? v : null;
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function InfoCard({ icon, label, value, errorLabel }) {
  return (
    <div className="pp-info-card">
      <span className="material-symbols-outlined">{icon}</span>
      <div>
        <p className={`pp-label${errorLabel ? " pp-label--error" : ""}`}>{label}</p>
        {value ? <p className="pp-value">{value}</p> : <p className="pp-value pp-value--empty">—</p>}
      </div>
    </div>
  );
}

function MedicalRow({ icon, label, value, emergency }) {
  return (
    <div className={`pp-medical-row${emergency ? " pp-medical-row--emergency" : ""}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <div>
        <p className={`pp-label${emergency ? " pp-label--error" : ""}`}>{label}</p>
        {value ? <p className="pp-value">{value}</p> : <p className="pp-value pp-value--empty">—</p>}
      </div>
    </div>
  );
}

export function PatientProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientProfile()
      .then((res) => setProfile(res?.data ?? null))
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const avatarUrl = val(profile?.avatarUrl);

  return (
    <div className="pp-page">
      <header className="pp-header">
        <div className="pp-header-inner">
          <button className="pp-back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="pp-page-title">Cài đặt tài khoản</h1>
        </div>
      </header>

      <main className="pp-main">
        <aside className="pp-sidebar">
          <nav className="pp-nav">
            <Link className="pp-nav-link active" to="/profile">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
              Hồ sơ cá nhân
            </Link>
            <Link className="pp-nav-link" to="/change-password">
              <span className="material-symbols-outlined">lock</span>
              Đổi mật khẩu
            </Link>
            <Link className="pp-nav-link" to="/medical-history">
              <span className="material-symbols-outlined">history</span>
              Tiền sử bệnh lý
            </Link>
          </nav>
        </aside>

        <section className="pp-content">
          <Link className="pp-edit-btn" to="/profile/edit">
            <span className="material-symbols-outlined">edit</span>
            Chỉnh sửa hồ sơ
          </Link>

          {loading ? (
            <div className="pp-loading">Đang tải dữ liệu...</div>
          ) : (
            <>
              <div className="pp-hero">
                <SafeAvatar
                  src={avatarUrl}
                  alt={profile?.fullName || "Avatar"}
                  name={profile?.fullName}
                  imageClassName="pp-avatar"
                  fallbackClassName="pp-avatar pp-avatar--fallback"
                />
                <h2 className="pp-user-name">{val(profile?.fullName) ?? "—"}</h2>
                <span className="pp-role-chip">Bệnh nhân</span>
              </div>

              {profile && (
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", background: "rgba(22,163,74,0.07)", border: "1.5px solid rgba(22,163,74,0.25)", margin: "16px 0" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "26px", color: "#16a34a", fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Số dư ví</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#16a34a" }}>{Number(profile?.walletBalance ?? 0).toLocaleString("vi-VN")} ₫</p>
                  </div>
                  <p style={{ margin: "0 0 0 auto", fontSize: "12px", color: "#9ca3af", maxWidth: "150px", textAlign: "right" }}>
                    Tiền hoàn từ lịch hẹn đã hủy
                  </p>
                </div>
              )}

              <div className="pp-divider" />

              <div className="pp-section">
                <h3 className="pp-section-title">Thông tin cơ bản</h3>
                <div className="pp-basic-grid">
                  <InfoCard icon="mail" label="Email" value={val(profile?.email)} />
                  <InfoCard icon="person" label="Họ và tên" value={val(profile?.fullName)} />
                  <InfoCard icon="call" label="Số điện thoại" value={val(profile?.phone)} />
                </div>
              </div>

              <div className="pp-section">
                <h3 className="pp-section-title">Y tế &amp; Bảo hiểm</h3>
                <div className="pp-medical-grid">
                  <div className="pp-medical-col">
                    <MedicalRow icon="calendar_today" label="Ngày sinh" value={formatDate(profile?.dateOfBirth)} />
                    <MedicalRow icon="badge" label="CCCD/CMND" value={val(profile?.identityNumber)} />
                    <MedicalRow icon="health_and_safety" label="Mã thẻ BHYT" value={val(profile?.insuranceNumber)} />
                    <MedicalRow
                      icon="wc"
                      label="Giới tính"
                      value={GENDER_LABEL[profile?.gender] ?? val(profile?.gender)}
                    />
                  </div>
                  <div className="pp-medical-col">
                    <MedicalRow
                      icon="bloodtype"
                      label="Nhóm máu"
                      value={BLOOD_LABEL[profile?.bloodType] ?? val(profile?.bloodType)}
                    />
                    <MedicalRow
                      icon="warning"
                      label="Liên hệ khẩn cấp"
                      value={val(profile?.emergencyContactPhone)}
                      emergency
                    />
                  </div>
                </div>
              </div>

              <div className="pp-full-section">
                <InfoCard icon="location_on" label="Địa chỉ" value={val(profile?.address)} />
                <InfoCard icon="description" label="Ghi chú y tế" value={val(profile?.medicalHistoryNote)} />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
