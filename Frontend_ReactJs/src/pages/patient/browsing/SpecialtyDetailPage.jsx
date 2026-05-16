import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SafeAvatar } from "../../../components/common/SafeAvatar";
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
      <div className="page-hero page-hero--light">
        <div className="site-container">
          <nav className="breadcrumb">
            <Link to="/specialties">Chuyên khoa</Link>
            <span>/</span>
            <span>{specialty?.name ?? "Chi tiết"}</span>
          </nav>
          <h1>{specialty?.name}</h1>
          {specialty?.description ? (
            <p>{specialty.description}</p>
          ) : null}
        </div>
      </div>

      <div className="site-container browse-content">
        <div className="browse-section-header">
          <h2>
            Bác sĩ chuyên khoa {specialty?.name}
            <span className="count-badge">{doctors.length}</span>
          </h2>
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
        <SafeAvatar
          src={doctor.avatarUrl}
          alt={doctor.fullName}
          name={doctor.fullName}
          imageClassName=""
          fallbackClassName="doctor-avatar-initial"
        />
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
        </div>
        <Link className="button button--soft" to={`/doctors/${doctor.id}`}>
          Đặt lịch
        </Link>
      </div>
    </article>
  );
}
