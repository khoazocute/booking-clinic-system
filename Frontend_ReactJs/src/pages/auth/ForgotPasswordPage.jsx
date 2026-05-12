import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  lockIcon,
  mailIcon,
  medicalServicesIcon,
} from "../../assets/icons/auth";
import { forgotPassword, resetPassword } from "../../services/authService";

const STEP = {
  EMAIL: "email",
  RESET: "reset",
  SUCCESS: "success",
};

const copy = {
  pageTitle: "Quên mật khẩu?",
  pageDescription:
    "Vui lòng nhập địa chỉ email bạn đã sử dụng để đăng ký. Chúng tôi sẽ gửi cho bạn mã OTP để đặt lại mật khẩu.",
  otpTitle: "Nhập mã OTP",
  otpDescription:
    "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam) và nhập mã bên dưới.",
  successTitle: "Đặt lại thành công!",
  successDescription:
    "Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.",
  sendOtp: "Gửi mã OTP",
  sending: "Đang gửi...",
  resetPassword: "Đặt lại mật khẩu",
  resetting: "Đang xử lý...",
  backToLogin: "Quay lại trang Đăng nhập",
  goToLogin: "Đi đến trang Đăng nhập",
  resendOtp: "Gửi lại mã OTP",
  confirmPasswordError: "Mật khẩu xác nhận không khớp.",
  passwordPlaceholder: "********",
};

function FieldIcon({ src, alt }) {
  return <img className="auth-field__icon" src={src} alt={alt} />;
}

/* ------------------------------------------------------------------ */
/*  OTP Input – 6 separate digit boxes                                */
/* ------------------------------------------------------------------ */
function OtpInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  function focusInput(index) {
    inputRefs.current[index]?.focus();
  }

  function handleChange(index, event) {
    const char = event.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
    if (char && index < 5) focusInput(index + 1);
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    focusInput(Math.min(pasted.length, 5));
  }

  return (
    <div className="otp-input-group">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          className="otp-input-box"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Countdown Timer for OTP resend                                    */
/* ------------------------------------------------------------------ */
function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  function restart(sec) {
    setSeconds(sec ?? initialSeconds);
  }

  return { seconds, restart };
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { seconds, restart } = useCountdown(60);

  /* ---------- Step 1: Send OTP ---------- */
  async function handleSendOtp(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await forgotPassword({ email: email.trim() });
      restart(60);
      setStep(STEP.RESET);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Resend OTP ---------- */
  async function handleResendOtp() {
    try {
      setError("");
      await forgotPassword({ email: email.trim() });
      restart(60);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  /* ---------- Step 2: Reset Password ---------- */
  async function handleResetPassword(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(copy.confirmPasswordError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await resetPassword({
        email: email.trim(),
        otpCode: otp,
        newPassword,
      });
      setStep(STEP.SUCCESS);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Eye Icons ---------- */
  function VisibilityIcon({ isVisible }) {
    if (isVisible) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    );
  }

  /* ---------- Shared visual left panel ---------- */
  function renderVisual() {
    return (
      <section className="forgot-card__visual">
        <div className="forgot-card__glow forgot-card__glow--top" />
        <div className="forgot-card__glow forgot-card__glow--mid" />
        <div className="forgot-card__glow forgot-card__glow--bottom" />

        <div className="forgot-card__brand">
          <div className="forgot-card__brand-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 2.18L18 7.4v3.6c0 4.52-3.13 8.76-6 9.88-2.87-1.12-6-5.36-6-9.88V7.4l6-3.22zM12 7a3 3 0 100 6 3 3 0 000-6zm0 2a1 1 0 110 2 1 1 0 010-2z"
                fill="white"
              />
            </svg>
          </div>
          <h1>MediCare</h1>
          <p>
            Giải pháp quản lý sức khỏe toàn diện và bảo mật. Chúng tôi luôn sẵn
            sàng hỗ trợ bạn khôi phục tài khoản.
          </p>
        </div>
      </section>
    );
  }

  /* ---------- Step indicator dots ---------- */
  function renderStepIndicator() {
    const steps = [STEP.EMAIL, STEP.RESET, STEP.SUCCESS];
    const currentIndex = steps.indexOf(step);
    return (
      <div className="forgot-steps">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`forgot-step-dot ${i <= currentIndex ? "forgot-step-dot--active" : ""}`}
          />
        ))}
      </div>
    );
  }

  /* ---------- Render form content by step ---------- */
  function renderFormContent() {
    if (step === STEP.SUCCESS) {
      return (
        <div className="forgot-success">
          <div className="forgot-success__icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#1f8f55" opacity="0.12" />
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="#1f8f55"
              />
            </svg>
          </div>
          <h2 className="forgot-success__title">{copy.successTitle}</h2>
          <p className="forgot-success__description">{copy.successDescription}</p>
          <Link
            to="/login"
            className="button button--primary auth-form__submit forgot-success__button"
          >
            {copy.goToLogin}
          </Link>
        </div>
      );
    }

    if (step === STEP.RESET) {
      return (
        <>
          <header className="forgot-card__header">
            <h2>{copy.otpTitle}</h2>
            <p>
              {copy.otpDescription}{" "}
              <strong className="forgot-card__email-highlight">{email}</strong>
            </p>
          </header>

          <form className="auth-form forgot-form" onSubmit={handleResetPassword}>
            {error ? (
              <p className="auth-form__message auth-form__message--error">{error}</p>
            ) : null}

            {/* OTP */}
            <div className="auth-field">
              <label>Mã OTP</label>
              <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
              <div className="forgot-otp-actions">
                {seconds > 0 ? (
                  <span className="forgot-otp-timer">
                    Gửi lại sau {seconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="forgot-otp-resend"
                    onClick={handleResendOtp}
                  >
                    {copy.resendOtp}
                  </button>
                )}
              </div>
            </div>

            {/* New Password */}
            <div className="auth-field">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <div className="auth-field__input-wrap">
                <FieldIcon src={lockIcon} alt="" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="auth-field__input--with-toggle"
                  placeholder={copy.passwordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <VisibilityIcon isVisible={showNewPassword} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="auth-field__input-wrap">
                <FieldIcon src={lockIcon} alt="" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="auth-field__input--with-toggle"
                  placeholder={copy.passwordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <VisibilityIcon isVisible={showConfirmPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className="button button--primary auth-form__submit"
              type="submit"
              disabled={submitting || otp.length < 6}
            >
              {submitting ? copy.resetting : copy.resetPassword}
            </button>
          </form>

          {/* Back */}
          <div className="forgot-back">
            <button
              type="button"
              className="forgot-back__link"
              onClick={() => {
                setStep(STEP.EMAIL);
                setError("");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              ← Thay đổi email
            </button>
          </div>
        </>
      );
    }

    /* ---------- Default: EMAIL step ---------- */
    return (
      <>
        <header className="forgot-card__header">
          <h2>{copy.pageTitle}</h2>
          <p>{copy.pageDescription}</p>
        </header>

        <form className="auth-form forgot-form" onSubmit={handleSendOtp}>
          {error ? (
            <p className="auth-form__message auth-form__message--error">{error}</p>
          ) : null}

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="forgotEmail">Địa chỉ Email</label>
            <div className="auth-field__input-wrap">
              <FieldIcon src={mailIcon} alt="" />
              <input
                id="forgotEmail"
                name="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            className="button button--primary auth-form__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? copy.sending : copy.sendOtp}
          </button>
        </form>

        {/* Back to Login */}
        <div className="forgot-back">
          <Link to="/login" className="forgot-back__link">
            ← {copy.backToLogin}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        {renderVisual()}

        <section className="forgot-card__form-wrap">
          <div className="forgot-card__form">
            {/* Mobile brand */}
            <div className="forgot-card__mobile-brand">
              <FieldIcon src={medicalServicesIcon} alt="MediCare" />
              <span>MediCare</span>
            </div>

            {renderStepIndicator()}
            {renderFormContent()}
          </div>
        </section>
      </div>
    </div>
  );
}
