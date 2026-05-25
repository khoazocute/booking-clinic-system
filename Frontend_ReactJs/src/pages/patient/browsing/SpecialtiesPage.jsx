import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import heroDoctorImage from "../../../assets/images/homepage/hero-doctor.jpg";
import { getSpecialties } from "../../../services/specialtyService";

const specialtyIcons = {
  "ung thư": "monitor_heart",
  "phụ sản": "pregnant_woman",
  "tim mạch": "cardiology",
  "da liễu": "dermatology",
  "tai mũi họng": "hearing",
  "thần kinh": "neurology",
  "nhi khoa": "child_care",
  "hô hấp": "pulmonology",
  "tiêu hóa": "gastroenterology",
  "cơ xương khớp": "orthopedics",
};

function getSpecialtyIcon(name) {
  return specialtyIcons[String(name ?? "").trim().toLowerCase()] ?? "medical_services";
}

export function SpecialtiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputValue, setInputValue] = useState(searchParams.get("keyword") ?? "");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getSpecialties({ keyword })
      .then((res) => {
        if (active) {
          setSpecialties(res?.data?.items ?? res?.data ?? []);
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
  }, [keyword]);

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    setKeyword(trimmed);
    if (trimmed) {
      setSearchParams({ keyword: trimmed });
    } else {
      setSearchParams({});
    }
  }

  function handleQuickSearch(value) {
    setInputValue(value);
    setKeyword(value);
    setSearchParams({ keyword: value });
  }

  const popularSpecialties = specialties.slice(0, 3);

  return (
    <div
      className="browse-page browse-page--specialties"
      style={{ "--specialties-hero-image": `url(${heroDoctorImage})` }}
    >
      <section
        className="specialties-hero specialties-hero--image"
      >
        <div className="site-container specialties-hero__inner">
          <div className="specialties-hero__copy">
            <span className="specialties-hero__eyebrow">Chuyên khoa MediCare</span>
            <h1>Tìm đúng chuyên khoa cho nhu cầu khám của bạn</h1>
            <p>
              Tra cứu chuyên khoa theo triệu chứng, nhóm bệnh hoặc chọn trực tiếp để xem bác sĩ phù hợp.
            </p>

            <form className="specialties-hero-search" onSubmit={handleSearch}>
              <div className="specialties-hero-search__field">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="search"
                  placeholder="Tìm chuyên khoa, triệu chứng..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <button className="button button--primary specialties-hero-search__button" type="submit">
                Tìm kiếm
              </button>
            </form>

            {popularSpecialties.length > 0 ? (
              <div className="specialties-quick-list">
                <span>Phổ biến:</span>
                {popularSpecialties.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickSearch(item.name)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="site-container browse-content specialties-content">
        {loading ? (
          <div className="browse-state">
            <p className="browse-state__text">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="browse-state browse-state--error">
            <p className="browse-state__text">{error}</p>
          </div>
        ) : specialties.length === 0 ? (
          <div className="browse-state">
            <p className="browse-state__text">Không tìm thấy chuyên khoa nào.</p>
          </div>
        ) : (
          <div className="browse-grid browse-grid--3 specialties-grid">
            {specialties.map((specialty) => (
              <article className="browse-card specialty-browse-card" key={specialty.id}>
                <div className="specialty-browse-card__head">
                  <span className="specialty-browse-card__icon-wrap">
                    <span className="specialty-browse-card__icon material-symbols-outlined">
                      {getSpecialtyIcon(specialty.name)}
                    </span>
                  </span>
                  <span className="specialty-browse-card__initial">
                    {specialty.name?.[0] ?? "K"}
                  </span>
                </div>

                <div className="browse-card__body specialty-browse-card__body">
                  <h3>{specialty.name}</h3>
                  {specialty.description ? (
                    <p className="browse-card__desc">{specialty.description}</p>
                  ) : null}
                </div>

                <div className="browse-card__footer specialty-browse-card__footer">
                  <span className="specialty-browse-card__hint">
                    <span className="material-symbols-outlined">groups</span>
                    Xem bác sĩ
                  </span>
                  <Link className="specialty-browse-card__link" to={`/specialties/${specialty.id}`}>
                    Xem chi tiết
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
