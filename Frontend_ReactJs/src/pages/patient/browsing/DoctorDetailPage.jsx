import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDoctorById } from "../../../services/doctorService";


export function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError("");

    getDoctorById(id)
      .then((res) => {
        if (!active) return;
        setDoctor(res?.data ?? res ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state"><p>Đang tải...</p></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="browse-page">
        <div className="mc-container mc-state mc-state--error">
          <p>{error || "Không tìm thấy bác sĩ."}</p>
          <Link className="mc-btn mc-btn--outline" to="/doctors">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="mc-container mc-detail-layout">
        {/* Left: main content */}
        <div className="mc-detail-main">
          {/* Hero card */}
          <div className="mc-hero-card">
            <div className="mc-hero-avatar">
              {doctor.avatarUrl ? (
                <img src={doctor.avatarUrl} alt={doctor.fullName} />
              ) : (
                <span className="mc-avatar-initial" style={{ fontSize: "2.5rem" }}>
                  {doctor.fullName?.[0] ?? "B"}
                </span>
              )}
            </div>
            <div className="mc-hero-body">
              <h1 className="mc-hero-name">{doctor.fullName ?? `Bác sĩ #${doctor.id}`}</h1>
              {doctor.specialtyName && (
                <p className="mc-hero-specialty">{doctor.specialtyName}</p>
              )}
              <div className="mc-hero-stats">
                {doctor.averageRating != null && (
                  <span className="mc-hero-stat">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px", color: "#f59e0b" }}
                    >
                      star
                    </span>
                    <strong>{Number(doctor.averageRating).toFixed(1)}</strong>
                  </span>
                )}
                {doctor.experienceYears != null && (
                  <span className="mc-hero-stat">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px", color: "var(--primary)" }}
                    >
                      work
                    </span>
                    {doctor.experienceYears}+ năm kinh nghiệm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          {doctor.biography && (
            <div className="mc-section-card">
              <div className="mc-section-heading">
                <h2>Giới thiệu</h2>
              </div>
              <p className="mc-body-text">{doctor.biography}</p>
            </div>
          )}

          {/* Qualification */}
          {doctor.qualification && (
            <div className="mc-section-card">
              <div className="mc-section-heading">
                <h2>Bằng cấp & Chứng chỉ</h2>
              </div>
              <ul className="mc-credential-list">
                <li className="mc-credential-item">
                  <div className="mc-credential-icon">
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </div>
                  <div>
                    <p className="mc-credential-title">{doctor.qualification}</p>
                    {doctor.specialtyName && (
                      <p className="mc-credential-sub">{doctor.specialtyName}</p>
                    )}
                  </div>
                </li>
              </ul>
            </div>
          )}

        </div>

        {/* Right: booking sidebar */}
        <aside className="mc-detail-sidebar">
          <div className="mc-book-card">
            <div className="mc-book-card__header">
              <h3>Đặt lịch khám</h3>
              <p>Kiểm tra lịch trống và đặt lịch ngay</p>
            </div>
            <div className="mc-book-card__body">
              <div className="mc-book-next">
                <span className="material-symbols-outlined">person</span>
                <div>
                  <span className="mc-book-next__label">Bác sĩ</span>
                  <p className="mc-book-next__value">{doctor.fullName}</p>
                </div>
              </div>
              {doctor.specialtyName && (
                <div className="mc-book-next">
                  <span className="material-symbols-outlined">local_hospital</span>
                  <div>
                    <span className="mc-book-next__label">Chuyên khoa</span>
                    <p className="mc-book-next__value">{doctor.specialtyName}</p>
                  </div>
                </div>
              )}
              <Link
                className="mc-btn mc-btn--primary"
                to={`/booking?doctorId=${doctor.id}`}
                style={{ width: "100%", minHeight: "48px", fontSize: "15px" }}
              >
                Đặt lịch ngay
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
