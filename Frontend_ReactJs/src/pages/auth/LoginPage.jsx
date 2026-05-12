import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  arrowRightIcon,
  facebookIcon,
  googleIcon,
  lockIcon,
  mailIcon,
} from "../../assets/icons/auth";
import { useGoogleLogin } from "@react-oauth/google";
import {
  extractAccessToken,
  extractRefreshToken,
  getCurrentUser,
  login,
  loginWithGoogle,
  setAccessToken,
  setAuthSession,
} from "../../services/authService";

const copy = {
  tokenError:
    "Đăng nhập thành công nhưng không nhận được access token.",
  registerSuccess:
    "Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.",
  passwordPlaceholder: "********",
};

function LoginIcon({ src, alt }) {
  return <img className="auth-field__icon" src={src} alt={alt} />;
}

function SocialIcon({ src, alt }) {
  return <img className="auth-social__icon" src={src} alt={alt} />;
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
      const currentUserResponse = await getCurrentUser();
      const currentUser = currentUserResponse?.data;
      const destination =
        currentUser?.role === "DOCTOR" ? "/doctor" : "/";

      navigate(destination);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const loginWithGoogleHook = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setSubmitting(true);
        setError("");

        const response = await loginWithGoogle(tokenResponse.access_token);

        const accessToken = extractAccessToken(response);
        if (!accessToken) {
          throw new Error(copy.tokenError);
        }

        setAccessToken(accessToken);
        navigate("/");
      } catch (requestError) {
        setError(requestError.message || "Google login failed");
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    }
  });

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
              Clinical precision, human empathy. Access your healthcare portal
              securely.
            </p>
          </div>
        </section>

        <section className="login-card__form-wrap">
          <div className="login-card__form">
            <header className="login-card__header">
              <h2>Welcome Back</h2>
              <p>Please enter your details to sign in securely.</p>
            </header>

            <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
              {location.state?.registered ? (
                <p className="auth-form__message auth-form__message--success">
                  {copy.registerSuccess}
                </p>
              ) : null}
              {error ? (
                <p className="auth-form__message auth-form__message--error">{error}</p>
              ) : null}

              <div className="auth-field">
                <label htmlFor="loginEmail">Email Address</label>
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
                  <label htmlFor="loginPassword">Password</label>
                  <Link className="auth-field__link" to="/forgot-password">
                    Forgot Password?
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
                <span>Remember Me</span>
              </label>

              <button
                className="button button--primary auth-form__submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Logging in..." : "Login"}
                <img className="auth-submit__icon" src={arrowRightIcon} alt="" />
              </button>

              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <div className="auth-social">
                <button className="auth-social__button" type="button" onClick={() => loginWithGoogleHook()}>
                  <SocialIcon src={googleIcon} alt="Google" />
                  Google
                </button>
                <button className="auth-social__button" type="button">
                  <SocialIcon src={facebookIcon} alt="Facebook" />
                  Facebook
                </button>
              </div>

              <div className="auth-footer-line" />

              <p className="auth-form__footer">
                Don&apos;t have an account? <Link to="/register">Sign up</Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
