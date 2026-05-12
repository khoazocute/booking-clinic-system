import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../../../services/authService";
import "./ChangePassword.css";

const STRENGTH_COLORS = ["", "#ba1a1a", "#f59e0b", "#eab308", "#22c55e"];
const STRENGTH_LABELS = [
  { text: "Yếu",       color: "#ba1a1a" },
  { text: "Trung bình",color: "#f59e0b" },
  { text: "Mạnh",      color: "#eab308" },
  { text: "Rất mạnh",  color: "#22c55e" },
];

function calcStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[a-z]/.test(password))         score++;
  if (/\d/.test(password))            score++;
  if (/[@$!%*?&^#~]/.test(password))  score++;
  // Map 0-5 score → 0-4 display levels
  if (score === 0) return 0;
  if (score <= 2)  return 1;
  if (score === 3) return 2;
  if (score === 4) return 3;
  return 4;
}

function PasswordInput({ name, value, show, placeholder, onChange, onToggle }) {
  return (
    <div className="cp-input-wrap">
      <span className="material-symbols-outlined cp-icon-left">lock</span>
      <input
        className="cp-input"
        type={show ? "text" : "password"}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required
      />
      <button type="button" className="cp-eye-btn" onClick={onToggle} aria-label="Hiện/ẩn mật khẩu">
        <span className="material-symbols-outlined">
          {show ? "visibility" : "visibility_off"}
        </span>
      </button>
    </div>
  );
}

export function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const strengthLevel = calcStrength(formData.newPassword);
  const segmentColor = STRENGTH_COLORS[strengthLevel];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleShow = (field) =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setMessage("Đổi mật khẩu thành công!");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cp-page">
      <header className="cp-header">
        <div className="cp-header-inner">
          <button
            className="cp-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="cp-title">Cài đặt tài khoản</h1>
        </div>
      </header>

      <main className="cp-main">
        <aside className="cp-sidebar">
          <nav className="cp-nav">
            <Link className="cp-nav-link" to="/profile">
              <span className="material-symbols-outlined">person</span>
              Hồ sơ cá nhân
            </Link>
            <Link className="cp-nav-link active" to="/change-password">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              Đổi mật khẩu
            </Link>
            <Link className="cp-nav-link" to="/medical-history">
              <span className="material-symbols-outlined">history</span>
              Tiền sử bệnh lý
            </Link>
          </nav>
        </aside>

        <section className="cp-content">
          <div className="cp-section-header">
            <h2>Đổi mật khẩu</h2>
            <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu với người khác.</p>
          </div>

          {message && <div className="msg-success">{message}</div>}
          {error   && <div className="msg-error">{error}</div>}

          <form className="cp-form" onSubmit={handleSubmit}>
            {/* Mật khẩu hiện tại */}
            <div className="cp-field">
              <label>Mật khẩu hiện tại</label>
              <PasswordInput
                name="oldPassword"
                value={formData.oldPassword}
                show={show.oldPassword}
                placeholder="••••••••"
                onChange={handleChange}
                onToggle={() => toggleShow("oldPassword")}
              />
            </div>

            {/* Mật khẩu mới + strength bar */}
            <div className="cp-field">
              <label>Mật khẩu mới</label>
              <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                show={show.newPassword}
                placeholder="Nhập mật khẩu mới"
                onChange={handleChange}
                onToggle={() => toggleShow("newPassword")}
              />
              <div className="cp-strength">
                <div className="cp-strength-bar">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="cp-strength-seg"
                      style={{
                        background: strengthLevel >= level ? segmentColor : undefined,
                      }}
                    />
                  ))}
                </div>
                <div className="cp-strength-labels">
                  {STRENGTH_LABELS.map(({ text, color }) => (
                    <span key={text} style={{ color }}>{text}</span>
                  ))}
                </div>
              </div>
              <p className="cp-hint">
                Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
              </p>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="cp-field">
              <label>Xác nhận mật khẩu mới</label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                show={show.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                onChange={handleChange}
                onToggle={() => toggleShow("confirmPassword")}
              />
            </div>

            <div className="cp-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
