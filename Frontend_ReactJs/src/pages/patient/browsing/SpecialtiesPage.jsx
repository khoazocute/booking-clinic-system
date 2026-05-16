import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getSpecialties } from "../../../services/specialtyService";

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

  return (
    <div className="browse-page">
      <div className="page-hero page-hero--primary">
        <div className="site-container">
          <h1>Chuyên khoa</h1>
          <p>Khám phá các chuyên khoa để tìm bác sĩ phù hợp nhất cho bạn</p>
        </div>
      </div>

      <div className="site-container browse-content">
        <form className="filter-bar" onSubmit={handleSearch}>
          <input
            className="filter-input"
            type="search"
            placeholder="Tìm kiếm chuyên khoa..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="button button--primary" type="submit">
            Tìm kiếm
          </button>
        </form>

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
          <div className="browse-grid browse-grid--3">
            {specialties.map((s) => (
              <article className="browse-card" key={s.id}>
                <div className="browse-card__icon">
                  <span>{s.name?.[0] ?? "+"}</span>
                </div>
                <div className="browse-card__body">
                  <h3>{s.name}</h3>
                  {s.description ? (
                    <p className="browse-card__desc">{s.description}</p>
                  ) : null}
                </div>
                <div className="browse-card__footer">
                  <Link
                    className="button button--soft"
                    to={`/specialties/${s.id}`}
                  >
                    Xem chi tiết
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
