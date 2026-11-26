import { useEffect, useReducer } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../services/authService";

const ROLE_LABELS = { ADMIN: "quản trị viên", DOCTOR: "bác sĩ", PATIENT: "bệnh nhân" };
const HOME_BY_ROLE = { ADMIN: "/admin", DOCTOR: "/doctor", PATIENT: "/" };

/** Role claim of the stored access token (the backend signs it into the JWT), or null when logged out. */
function currentRole() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=")));
    return String(claims.role ?? "").trim().toUpperCase() || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

/**
 * UI guard for role-specific areas. The backend still enforces every permission; this only stops a
 * page from rendering with "Forbidden" data. All tabs share one login (localStorage), so when another
 * tab logs in as a different user this re-checks immediately via the `storage` event.
 */
export function RequireRole({ roles }) {
  const [, recheck] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === "accessToken") recheck();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const role = currentRole();
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <AccessDenied role={role} required={roles} />;
  return <Outlet />;
}

function AccessDenied({ role, required }) {
  const navigate = useNavigate();

  function switchAccount() {
    clearAccessToken();
    navigate("/login");
  }

  return (
    <main className="access-denied">
      <section className="access-denied__card">
        <span className="material-symbols-outlined">lock</span>
        <h1>Không có quyền truy cập</h1>
        <p>
          Trang này dành cho tài khoản <strong>{required.map((r) => ROLE_LABELS[r] ?? r).join(" / ")}</strong>, nhưng
          trình duyệt đang đăng nhập bằng tài khoản <strong>{ROLE_LABELS[role] ?? role.toLowerCase()}</strong>.
        </p>
        <p className="access-denied__hint">
          Các tab trong cùng một trình duyệt dùng chung phiên đăng nhập. Nếu bạn vừa đăng nhập tài khoản khác ở tab
          khác, hãy dùng cửa sổ ẩn danh hoặc trình duyệt khác cho tài khoản thứ hai.
        </p>
        <div className="access-denied__actions">
          <Link className="button button--ghost" to={HOME_BY_ROLE[role] ?? "/"}>
            Về trang của tôi
          </Link>
          <button className="button button--primary" type="button" onClick={switchAccount}>
            Đăng nhập tài khoản khác
          </button>
        </div>
      </section>
    </main>
  );
}
