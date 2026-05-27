import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SafeAvatar } from "../../../components/common/SafeAvatar";
import doctorsBackgroundImage from "../../../assets/images/homepage/background1.png";
import { getDoctors } from "../../../services/doctorService";
import { getDoctorAvatar } from "../../../utils/doctorHelpers";
import { getSpecialties } from "../../../services/specialtyService";

function formatCurrency(value) {
  if (value == null || Number(value) <= 0) return "Chưa cập nhật";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function getRating(doctor) {
  return doctor.averageRating == null ? 0 : Number(doctor.averageRating);
}

export function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputKeyword, setInputKeyword] = useState(searchParams.get("keyword") ?? "");
  const [specialtyId, setSpecialtyId] = useState(searchParams.get("specialtyId") ?? "");
  const [minExperience, setMinExperience] = useState(searchParams.get("minExperience") ?? "");
  const [sortBy, setSortBy] = useState("rating");

  const selectedSpecialty = useMemo(
    () => specialties.find((specialty) => String(specialty.id) === String(specialtyId)),
    [specialties, specialtyId]
  );

  const visibleDoctors = useMemo(() => {
    const minYears = Number(minExperience || 0);

    return [...doctors]
      .filter((doctor) => Number(doctor.experienceYears ?? 0) >= minYears)
      .sort((a, b) => {
        if (sortBy === "experience") {
          return Number(b.experienceYears ?? 0) - Number(a.experienceYears ?? 0);
        }
        if (sortBy === "fee") {
          return Number(a.consultationFee ?? 0) - Number(b.consultationFee ?? 0);
        }
        return getRating(b) - getRating(a);
      });
  }, [doctors, minExperience, sortBy]);

  useEffect(() => {
    getSpecialties()
      .then((res) => setSpecialties(res?.data?.items ?? res?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getDoctors({ keyword, specialtyId: specialtyId || undefined })
      .then((res) => {
        if (!active) return;
        setDoctors(res?.data?.items ?? res?.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [keyword, specialtyId]);

  function syncSearchParams(nextKeyword, nextSpecialtyId, nextExperience) {
    const params = {};
    if (nextKeyword) params.keyword = nextKeyword;
    if (nextSpecialtyId) params.specialtyId = nextSpecialtyId;
    if (nextExperience) params.minExperience = nextExperience;
    setSearchParams(params);
  }

  function handleSearch(event) {
    event.preventDefault();
    const nextKeyword = inputKeyword.trim();
    setKeyword(nextKeyword);
    syncSearchParams(nextKeyword, specialtyId, minExperience);
  }

  function handleSpecialtyChange(nextSpecialtyId) {
    const value = specialtyId === nextSpecialtyId ? "" : nextSpecialtyId;
    setSpecialtyId(value);
    syncSearchParams(keyword, value, minExperience);
  }

  function handleExperienceChange(event) {
    const value = event.target.value;
    setMinExperience(value);
    syncSearchParams(keyword, specialtyId, value);
  }

  function handleClearFilters() {
    setKeyword("");
    setInputKeyword("");
    setSpecialtyId("");
    setMinExperience("");
    setSortBy("rating");
    setSearchParams({});
  }

  return (
    <div
      className="doctor-directory-page"
      style={{ "--doctor-directory-bg": `url(${doctorsBackgroundImage})` }}
    >
      <section className="doctor-directory-hero">
        <div className="site-container doctor-directory-hero__inner">
          <span className="doctor-directory-hero__eyebrow">MediCare Doctors</span>
          <h1>Tìm bác sĩ chuyên khoa</h1>
          <p>Tra cứu bác sĩ theo tên, chuyên khoa và kinh nghiệm để đặt lịch khám nhanh hơn.</p>

          <form className="doctor-directory-search" onSubmit={handleSearch}>
            <label className="doctor-directory-search__field">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                placeholder="Tên bác sĩ hoặc triệu chứng..."
                value={inputKeyword}
                onChange={(event) => setInputKeyword(event.target.value)}
              />
            </label>

            <label className="doctor-directory-search__field">
              <span className="material-symbols-outlined">medical_services</span>
              <select value={specialtyId} onChange={(event) => handleSpecialtyChange(event.target.value)}>
                <option value="">Chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={String(specialty.id)}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="doctor-directory-search__field">
              <span className="material-symbols-outlined">history_edu</span>
              <select value={minExperience} onChange={handleExperienceChange}>
                <option value="">Kinh nghiệm</option>
                <option value="5">5+ năm</option>
                <option value="10">10+ năm</option>
                <option value="15">15+ năm</option>
              </select>
            </label>

            <button type="submit">Tìm ngay</button>
          </form>
        </div>
      </section>

      <main className="site-container doctor-directory-layout">
        <aside className="doctor-directory-sidebar">
          <section className="doctor-directory-panel">
            <div className="doctor-directory-panel__head">
              <h2>Chuyên khoa</h2>
              <button type="button" onClick={handleClearFilters}>Xóa lọc</button>
            </div>

            <div className="doctor-directory-checks">
              {specialties.map((specialty) => {
                const id = String(specialty.id);
                return (
                  <label key={specialty.id}>
                    <input
                      type="checkbox"
                      checked={specialtyId === id}
                      onChange={() => handleSpecialtyChange(id)}
                    />
                    <span>{specialty.name}</span>
                  </label>
                );
              })}
              {specialties.length === 0 ? <p>Đang tải chuyên khoa...</p> : null}
            </div>
          </section>

          <section className="doctor-directory-ai">
            <div>
              <span className="material-symbols-outlined">smart_toy</span>
              <strong>Trợ lý AI</strong>
            </div>
            <p>Mô tả triệu chứng, AI sẽ gợi ý chuyên khoa phù hợp để bạn chọn bác sĩ nhanh hơn.</p>
          </section>
        </aside>

        <section className="doctor-directory-results">

          {loading ? (
            <div className="doctor-directory-state">Đang tải danh sách bác sĩ...</div>
          ) : error ? (
            <div className="doctor-directory-state doctor-directory-state--error">{error}</div>
          ) : visibleDoctors.length === 0 ? (
            <div className="doctor-directory-state">Không tìm thấy bác sĩ phù hợp.</div>
          ) : (
            <div className="doctor-directory-grid">
              {visibleDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DoctorCard({ doctor }) {
  return (
    <article className="doctor-directory-card">
      <div className="doctor-directory-card__top">
        <div className="doctor-directory-card__avatar">
          <SafeAvatar
            src={doctor.avatarUrl}
            alt={doctor.fullName}
            name={doctor.fullName}
            imageClassName=""
            fallbackClassName="mc-avatar-initial"
            defaultSrc={getDoctorAvatar(doctor.id)}
          />
          <span className="doctor-directory-card__status-dot" />
        </div>

        <div className="doctor-directory-card__info">
          <div className="doctor-directory-card__title">
            <h3>{doctor.fullName ?? `Bác sĩ #${doctor.id}`}</h3>
            <span>Đang hoạt động</span>
          </div>
          <p>{doctor.specialtyName ?? "Chuyên khoa"}</p>
          {doctor.averageRating != null ? (
            <div className="doctor-directory-card__rating">
              <span className="material-symbols-outlined">star</span>
              <strong>{Number(doctor.averageRating).toFixed(1)}</strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="doctor-directory-card__stats">
        <div>
          <span>Kinh nghiệm</span>
          <strong>{doctor.experienceYears != null ? `${doctor.experienceYears} năm` : "Chưa cập nhật"}</strong>
        </div>
        <div>
          <span>Phí khám</span>
          <strong>{formatCurrency(doctor.consultationFee)}</strong>
        </div>
      </div>

      <div className="doctor-directory-card__actions">
        <Link to={`/doctors/${doctor.id}`}>Xem hồ sơ</Link>
        <Link to={`/booking?doctorId=${doctor.id}`}>Đặt lịch</Link>
      </div>
    </article>
  );
}
