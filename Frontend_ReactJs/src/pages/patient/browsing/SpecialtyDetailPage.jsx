import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSpecialtyById } from "../../../services/specialtyService";
import { getDoctors } from "../../../services/doctorService";

export function SpecialtyDetailPage() {
  const { id } = useParams();
  const [specialty, setSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getSpecialtyById(id),
      getDoctors({ specialtyId: id, status: "ACTIVE" }),
    ])
      .then(([specRes, docRes]) => {
        if (active) {
          setSpecialty(specRes?.data ?? specRes ?? null);
          setDoctors(docRes?.data?.items ?? docRes?.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="browse-page">
        <div className="site-container browse-content">
          <div className="browse-state">
            <p className="browse-state__text">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="browse-page">
        <div className="site-container browse-content">
          <div className="browse-state browse-state--error">
            <p className="browse-state__text">{error}</p>
            <Link className="button button--ghost" to="/specialties">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">

      {/* ── Breadcrumb ── */}
      <div className="spec-breadcrumb-bar">
        <div className="site-container">
          <nav className="breadcrumb">
            <Link to="/specialties">Chuyên khoa</Link>
            <span>/</span>
            <span>{specialty?.name ?? "Chi tiết"}</span>
          </nav>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PHẦN 1 — Thông tin chuyên khoa
          ══════════════════════════════════════ */}
      <div className="site-container">
        <div className="spec-info-card">
          <div className="spec-info-card__icon-wrap">
            <span className="spec-info-card__initial">
              {specialty?.name?.[0] ?? "K"}
            </span>
          </div>

          <div className="spec-info-card__body">
            <div className="spec-info-card__badge">Chuyên khoa</div>
            <h1 className="spec-info-card__name">{specialty?.name}</h1>
            {specialty?.description ? (
              <p className="spec-info-card__desc">{specialty.description}</p>
            ) : null}

            <div className="spec-info-card__stats">
              <div className="spec-stat">
                <span className="material-symbols-outlined spec-stat__icon">groups</span>
                <div>
                  <span className="spec-stat__value">{doctors.length}</span>
                  <span className="spec-stat__label">Bác sĩ</span>
                </div>
              </div>
              <div className="spec-stat">
                <span className="material-symbols-outlined spec-stat__icon">verified</span>
                <div>
                  <span className="spec-stat__value">100%</span>
                  <span className="spec-stat__label">Được xác minh</span>
                </div>
              </div>
              <div className="spec-stat">
                <span className="material-symbols-outlined spec-stat__icon">schedule</span>
                <div>
                  <span className="spec-stat__value">Linh hoạt</span>
                  <span className="spec-stat__label">Lịch khám</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PHẦN 2 — Danh sách bác sĩ
          ══════════════════════════════════════ */}
      <div className="site-container spec-doctors-section">
        <div className="spec-section-header">
          <div className="spec-section-header__left">
            <span className="spec-section-header__label">Đội ngũ bác sĩ</span>
            <h2 className="spec-section-header__title">
              Bác sĩ chuyên khoa {specialty?.name}
              <span className="count-badge">{doctors.length}</span>
            </h2>
          </div>
          <Link className="text-link" to={`/doctors?specialtyId=${id}`}>
            Xem tất cả →
          </Link>
        </div>

        {doctors.length === 0 ? (
          <div className="browse-state">
            <p className="browse-state__text">
              Chưa có bác sĩ nào cho chuyên khoa này.
            </p>
          </div>
        ) : (
          <div className="doctor-grid">
            {doctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function DoctorCard({ doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-image doctor-image--placeholder">
        {doctor.avatarUrl ? (
          <img src={doctor.avatarUrl} alt={doctor.fullName} />
        ) : (
          <span className="doctor-avatar-initial">
            {doctor.fullName?.[0] ?? "B"}
          </span>
        )}
      </div>
      <div className="doctor-body">
        <div className="doctor-header">
          <h3>{doctor.fullName ?? `Bác sĩ #${doctor.id}`}</h3>
          {doctor.averageRating != null ? (
            <span className="doctor-rating">★ {Number(doctor.averageRating).toFixed(1)}</span>
          ) : null}
        </div>
        <p className="doctor-specialty">{doctor.specialtyName ?? "Chuyên khoa"}</p>
        {doctor.experienceYears != null ? (
          <p className="doctor-experience">{doctor.experienceYears} năm kinh nghiệm</p>
        ) : null}
      </div>
      <div className="doctor-footer">
        <div>
          {doctor.qualification ? (
            <p className="doctor-fee-label">{doctor.qualification}</p>
          ) : null}
          {doctor.consultationFee != null && doctor.consultationFee > 0 ? (
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
              {Number(doctor.consultationFee).toLocaleString("vi-VN")} ₫
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link className="button button--ghost" to={`/doctors/${doctor.id}`}>
            Hồ sơ
          </Link>
          <Link className="button button--soft" to={`/booking?doctorId=${doctor.id}`}>
            Đặt lịch
          </Link>
        </div>
      </div>
    </article>
  );
}
