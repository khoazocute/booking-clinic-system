import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDoctors } from "../../../services/doctorService";
import { getSpecialties } from "../../../services/specialtyService";

export function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputKeyword, setInputKeyword] = useState(searchParams.get("keyword") ?? "");
  const [specialtyId, setSpecialtyId] = useState(searchParams.get("specialtyId") ?? "");

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
        if (active) {
          setDoctors(res?.data?.items ?? res?.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) { setError(err.message); setLoading(false); }
      });
    return () => { active = false; };
  }, [keyword, specialtyId]);

  function handleSearch(e) {
    e.preventDefault();
    const kw = inputKeyword.trim();
    setKeyword(kw);
    const p = {};
    if (kw) p.keyword = kw;
    if (specialtyId) p.specialtyId = specialtyId;
    setSearchParams(p);
  }

  function handleSpecialtyChange(sid) {
    const val = specialtyId === sid ? "" : sid;
    setSpecialtyId(val);
    const p = {};
    if (keyword) p.keyword = keyword;
    if (val) p.specialtyId = val;
    setSearchParams(p);
  }

  function handleClearFilters() {
    setSpecialtyId("");
    setKeyword("");
    setInputKeyword("");
    setSearchParams({});
  }

  return (
    <div className="browse-page">
      <main className="mc-container mc-page-body">
        <aside className="mc-filter-panel">
          <div className="mc-filter-card">
            <h3 className="mc-filter-title">Bộ lọc</h3>

            <div className="mc-filter-section">
              <span className="mc-label-caps">Chuyên khoa</span>
              <div className="mc-filter-list">
                {specialties.map((s) => (
                  <label key={s.id} className="mc-filter-check">
                    <input
                      type="checkbox"
                      checked={specialtyId === String(s.id)}
                      onChange={() => handleSpecialtyChange(String(s.id))}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
                {specialties.length === 0 && (
                  <span className="mc-text-muted">Đang tải...</span>
                )}
              </div>
            </div>

            <button className="mc-btn mc-btn--clear" type="button" onClick={handleClearFilters}>
              Xoá bộ lọc
            </button>
          </div>
        </aside>

        <section className="mc-result-section">
          <form className="mc-search-bar" onSubmit={handleSearch}>
            <span className="material-symbols-outlined mc-search-icon">search</span>
            <input
              className="mc-search-input"
              type="search"
              placeholder="Tìm theo tên bác sĩ..."
              value={inputKeyword}
              onChange={(e) => setInputKeyword(e.target.value)}
            />
            <button className="mc-btn mc-btn--primary" type="submit">Tìm kiếm</button>
          </form>

          {loading ? (
            <div className="mc-state"><p>Đang tải...</p></div>
          ) : error ? (
            <div className="mc-state mc-state--error"><p>{error}</p></div>
          ) : doctors.length === 0 ? (
            <div className="mc-state"><p>Không tìm thấy bác sĩ nào.</p></div>
          ) : (
            <div className="mc-doc-grid">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DoctorCard({ doc }) {
  return (
    <article className="mc-doc-card">
      <div className="mc-doc-card__inner">
        <div className="mc-doc-card__avatar">
          {doc.avatarUrl ? (
            <img src={doc.avatarUrl} alt={doc.fullName} />
          ) : (
            <span className="mc-avatar-initial">{doc.fullName?.[0] ?? "B"}</span>
          )}
        </div>
        <div className="mc-doc-card__info">
          <div className="mc-doc-card__header">
            <div>
              <h4 className="mc-doc-card__name">{doc.fullName ?? `Bác sĩ #${doc.id}`}</h4>
              <p className="mc-doc-card__specialty">{doc.specialtyName ?? "Chuyên khoa"}</p>
            </div>
            {doc.averageRating != null && (
              <span className="mc-rating-badge">
                <span className="material-symbols-outlined mc-star-icon" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {Number(doc.averageRating).toFixed(1)}
              </span>
            )}
          </div>
          <div className="mc-doc-card__meta">
            {doc.experienceYears != null && (
              <span className="mc-meta-item">
                <span className="material-symbols-outlined">work_history</span>
                {doc.experienceYears}+ năm kinh nghiệm
              </span>
            )}
            {doc.qualification && (
              <span className="mc-meta-item">
                <span className="material-symbols-outlined">workspace_premium</span>
                {doc.qualification}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mc-doc-card__actions">
        <Link className="mc-btn mc-btn--outline" to={`/doctors/${doc.id}`}>Xem hồ sơ</Link>
        <Link className="mc-btn mc-btn--primary" to={`/booking?doctorId=${doc.id}`}>Đặt lịch</Link>
      </div>
    </article>
  );
}
