import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  arrowRightIcon,
  facebookIcon,
  googleIcon,
  lockIcon,
  mailIcon,
} from "../../assets/icons/auth";
import {
  extractAccessToken,
  extractRefreshToken,
  getCurrentUser,
  login,
  loginWithGoogle,
  setAuthSession,
} from "../../services/authService";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const copy = {
  tokenError: "Đăng nhập thành công nhưng không nhận được access token.",
  registerSuccess: "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
  passwordPlaceholder: "********",
  googleUnavailable: "Hiện không thể đăng nhập bằng Google.",
};

function LoginIcon({ src, alt }) {
  return <img className="auth-field__icon" src={src} alt={alt} />;
}

function SocialIcon({ src, alt }) {
  return <img className="auth-social__icon" src={src} alt={alt} />;
}

function GoogleLoginButton({ disabled, onError, onSuccess }) {
  const loginWithGoogleHook = useGoogleLogin({
    onSuccess,
    onError,
  });

  return (
    <button
      className="auth-social__button"
      type="button"
      disabled={disabled}
      onClick={() => loginWithGoogleHook()}
    >
      <SocialIcon src={googleIcon} alt="Google" />
      Google
    </button>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email ?? "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function redirectAfterLogin() {
    const currentUserResponse = await getCurrentUser();
    const currentUser = currentUserResponse?.data;
    const destination = currentUser?.role === "DOCTOR" ? "/doctor" : "/";
    navigate(destination);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      const accessToken = extractAccessToken(response);
      const refreshToken = extractRefreshToken(response);

      if (!accessToken) {
        throw new Error(copy.tokenError);
      }

      setAuthSession({ accessToken, refreshToken });
      await redirectAfterLogin();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSuccess(tokenResponse) {
    try {
      setSubmitting(true);
      setError("");

      const response = await loginWithGoogle(tokenResponse.access_token);
      const accessToken = extractAccessToken(response);
      const refreshToken = extractRefreshToken(response);

      if (!accessToken) {
        throw new Error(copy.tokenError);
      }

      setAuthSession({ accessToken, refreshToken });
      await redirectAfterLogin();
    } catch (requestError) {
      setError(requestError.message || "Đăng nhập Google thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleError() {
    setError("Đăng nhập Google thất bại. Vui lòng đăng nhập bằng email.");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-card__visual">
          <div className="login-card__glow login-card__glow--top" />
          <div className="login-card__glow login-card__glow--mid" />
          <div className="login-card__glow login-card__glow--bottom" />

          <div className="login-card__brand">
            <h1>MedLink</h1>
            <p>
              Chăm sóc y tế chính xác, tận tâm. Truy cập cổng sức khỏe của bạn
              một cách an toàn.
            </p>
          </div>
        </section>

        <section className="login-card__form-wrap">
          <div className="login-card__form">
            <header className="login-card__header">
              <h2>Chào mừng trở lại</h2>
              <p>Nhập thông tin của bạn để đăng nhập an toàn.</p>
            </header>

            <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
              {location.state?.registered ? (
                <p className="auth-form__message auth-form__message--success">
                  {copy.registerSuccess}
                </p>
              ) : null}

              {error ? (
                <p className="auth-form__message auth-form__message--error">
                  {error}
                </p>
              ) : null}

              <div className="auth-field">
                <label htmlFor="loginEmail">Địa chỉ email</label>
                <div className="auth-field__input-wrap">
                  <LoginIcon src={mailIcon} alt="" />
                  <input
                    id="loginEmail"
                    name="email"
                    type="email"
                    placeholder="doctor@medlink.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field__row">
                  <label htmlFor="loginPassword">Mật khẩu</label>
                  <Link className="auth-field__link" to="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="auth-field__input-wrap">
                  <LoginIcon src={lockIcon} alt="" />
                  <input
                    id="loginPassword"
                    name="password"
                    type="password"
                    placeholder={copy.passwordPlaceholder}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label className="auth-form__remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <button
                className="button button--primary auth-form__submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                <img className="auth-submit__icon" src={arrowRightIcon} alt="" />
              </button>

              <div className="auth-divider">
                <span>HOẶC TIẾP TỤC VỚI</span>
              </div>

              <div className="auth-social">
                {GOOGLE_CLIENT_ID ? (
                  <GoogleLoginButton
                    disabled={submitting}
                    onError={handleGoogleError}
                    onSuccess={handleGoogleSuccess}
                  />
                ) : (
                  <button className="auth-social__button" type="button" disabled>
                    <SocialIcon src={googleIcon} alt="Google" />
                    {copy.googleUnavailable}
                  </button>
                )}

                <button className="auth-social__button" type="button">
                  <SocialIcon src={facebookIcon} alt="Facebook" />
                  Facebook
                </button>
              </div>

              <div className="auth-footer-line" />

              <p className="auth-form__footer">
                Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
