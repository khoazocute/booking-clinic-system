import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSideImage } from "../../assets/images/auth";
import {
  callIcon,
  lockIcon,
  mailIcon,
  medicalServicesIcon,
  personIcon,
} from "../../assets/icons/auth";
import { register } from "../../services/authService";

const copy = {
  confirmPasswordError: "M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.",
  agreementError:
    "B\u1ea1n c\u1ea7n \u0111\u1ed3ng \u00fd v\u1edbi \u0111i\u1ec1u kho\u1ea3n tr\u01b0\u1edbc khi \u0111\u0103ng k\u00fd.",
  registerSuccess:
    "\u0110\u0103ng k\u00fd th\u00e0nh c\u00f4ng. \u0110ang chuy\u1ec3n sang trang \u0111\u0103ng nh\u1eadp...",
  passwordPlaceholder: "********",
};

function FieldIcon({ src, alt }) {
  return <img className="auth-field__icon" src={src} alt={alt} />;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreement: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError(copy.confirmPasswordError);
      setSuccess("");
      return;
    }

    if (!form.agreement) {
      setError(copy.agreementError);
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      setSuccess(copy.registerSuccess);

      setTimeout(() => {
        navigate("/login", {
          state: {
            registered: true,
            email: form.email.trim(),
          },
        });
      }, 900);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-page__visual">
        <img src={registerSideImage} alt="Minh họa máy tính bảng y tế" />
        <div className="auth-page__overlay" />
        <div className="auth-page__message">
          <h1>
            Chăm sóc chính xác.
            <br />
            Tận tâm với người bệnh.
          </h1>
          <p>
            Tham gia hệ thống MediCare để truy cập hồ sơ sức khỏe,
            đặt lịch khám và kết nối với bác sĩ chuyên khoa.
          </p>
        </div>
      </section>

      <section className="auth-page__form-wrap">
        <div className="auth-page__form">
          <div className="auth-page__brand">
            <FieldIcon src={medicalServicesIcon} alt="MediCare" />
            <span>MediCare</span>
          </div>

          <header className="auth-page__header">
            <h2>Tạo tài khoản</h2>
            <p>Điền thông tin của bạn để bắt đầu sử dụng hệ thống.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error ? (
              <p className="auth-form__message auth-form__message--error">{error}</p>
            ) : null}
            {success ? (
              <p className="auth-form__message auth-form__message--success">{success}</p>
            ) : null}

            <div className="auth-field">
              <label htmlFor="fullName">Họ tên</label>
              <div className="auth-field__input-wrap">
                <FieldIcon src={personIcon} alt="" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Địa chỉ email</label>
              <div className="auth-field__input-wrap">
                <FieldIcon src={mailIcon} alt="" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="phone">Số điện thoại</label>
              <div className="auth-field__input-wrap">
                <FieldIcon src={callIcon} alt="" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-form__grid">
              <div className="auth-field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="auth-field__input-wrap">
                  <FieldIcon src={lockIcon} alt="" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={copy.passwordPlaceholder}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className="auth-field__input-wrap">
                  <FieldIcon src={lockIcon} alt="" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder={copy.passwordPlaceholder}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <label className="auth-form__agree">
              <input
                type="checkbox"
                name="agreement"
                checked={form.agreement}
                onChange={handleChange}
              />
              <span>
                Tôi đồng ý với <a href="/">Điều khoản dịch vụ</a> và{" "}
                <a href="/">Chính sách bảo mật</a>.
              </span>
            </label>

            <button
              className="button button--primary auth-form__submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>

            <p className="auth-form__footer">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
