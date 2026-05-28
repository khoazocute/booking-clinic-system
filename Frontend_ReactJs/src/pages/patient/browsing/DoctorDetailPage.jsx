import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SafeAvatar } from "../../../components/common/SafeAvatar";
import { getDoctorById } from "../../../services/doctorService";
import { getDoctorAvatar } from "../../../utils/doctorHelpers";

const DEFAULT_CLINIC_ADDRESS = "123 Healthcare Ave, District 1, Ho Chi Minh City";

function getClinicAddress(doctor) {
  if (doctor?.clinicRoom) {
    return `${doctor.clinicRoom}, ${DEFAULT_CLINIC_ADDRESS}`;
  }

  return DEFAULT_CLINIC_ADDRESS;
}

function toMapQuery(value) {
  return encodeURIComponent(value);
}

export function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

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

  async function handleDirectionsFromCurrentLocation() {
    const destination = getClinicAddress(doctor);

    if (!navigator.geolocation) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${toMapQuery(destination)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    try {
      setLocationLoading(true);
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const directionsUrl =
        `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${toMapQuery(destination)}&travelmode=driving`;

      window.open(directionsUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${toMapQuery(destination)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setLocationLoading(false);
    }
  }

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

  const clinicAddress = getClinicAddress(doctor);
  const embeddedMapUrl = `https://www.google.com/maps?q=${toMapQuery(clinicAddress)}&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${toMapQuery(clinicAddress)}`;

  return (
    <div className="browse-page">
      <div className="mc-container mc-detail-layout">
        {/* Left: main content */}
        <div className="mc-detail-main">
          {/* Hero card */}
          <div className="mc-hero-card">
            <div className="mc-hero-avatar">
              <SafeAvatar
                src={doctor.avatarUrl}
                fallbackSrc="/default-doctor.png"
                alt={doctor.fullName}
                name={doctor.fullName}
                imageClassName=""
                fallbackClassName="mc-avatar-initial"
                defaultSrc={getDoctorAvatar(doctor.id)}
              />
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

          <div className="mc-section-card">
            <div className="mc-section-heading">
              <h2>Vị trí phòng khám</h2>
            </div>
            <div className="mc-location-card">
              <div className="mc-location-copy">
                <p className="mc-location-label">Địa chỉ phòng khám</p>
                <p className="mc-location-address">{clinicAddress}</p>
                <div className="mc-location-actions">
                  <a
                    className="mc-btn mc-btn--primary"
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở Google Maps
                  </a>
                  <button
                    className="mc-btn mc-btn--outline"
                    type="button"
                    onClick={handleDirectionsFromCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? "Đang lấy vị trí..." : "Chỉ đường từ vị trí của tôi"}
                  </button>
                </div>
              </div>

              <div className="mc-location-map">
                <iframe
                  title={`Bản đồ phòng khám của ${doctor.fullName}`}
                  src={embeddedMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

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
