import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { getDoctorReviews } from "../../services/doctorPortalService";

const FILTERS = ["ALL", "POSITIVE", "CRITICAL"];

function getInitials(name) {
  if (!name) {
    return "PT";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={`${rating}-${index}`}>{index < Math.round(rating) ? "★" : "☆"}</span>
  ));
}

function exportReviewsCsv(reviews) {
  const csv = [
    ["Bệnh nhân", "Đánh giá", "Bình luận", "Lịch hẹn"],
    ...reviews.map((review) => [
      review.patientName ?? "",
      review.rating ?? "",
      review.comment ?? "",
      review.appointmentId ?? "",
    ]),
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "doctor-reviews.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function DoctorReviewsPage() {
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const result = await getDoctorReviews();
        if (active) {
          setDoctor(result.doctor ?? null);
          setReviews(result.reviews ?? []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviews.length;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const next = reviews.filter((review) => {
      const rating = Number(review.rating ?? 0);
      const matchesFilter =
        activeFilter === "ALL"
          ? true
          : activeFilter === "POSITIVE"
            ? rating >= 4
            : rating <= 2;
      const matchesSearch =
        !keyword ||
        review.patientName?.toLowerCase().includes(keyword) ||
        review.comment?.toLowerCase().includes(keyword) ||
        String(review.appointmentId ?? "").includes(keyword);

      return matchesFilter && matchesSearch;
    });

    return [...next].sort((left, right) => {
      if (sortBy === "rating") {
        return Number(right.rating ?? 0) - Number(left.rating ?? 0);
      }

      return Number(right.id ?? 0) - Number(left.id ?? 0);
    });
  }, [activeFilter, reviews, search, sortBy]);

  const recommendationRate = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return Math.round(
      (reviews.filter((review) => Number(review.rating ?? 0) >= 4).length / reviews.length) * 100,
    );
  }, [reviews]);

  const punctualityScore = useMemo(() => Math.max(0, averageRating - 0.2), [averageRating]);
  const communicationScore = useMemo(() => Math.min(5, averageRating + 0.1), [averageRating]);

  return (
    <DoctorWorkspace
      eyebrow="Chất lượng / Đánh giá"
      title="Phản hồi và đánh giá của bệnh nhân"
      description="Theo dõi mức độ hài lòng, kết quả phản hồi và chất lượng giao tiếp với bệnh nhân."
      actions={
        <>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => exportReviewsCsv(filteredReviews)}
          >
            <span className="material-symbols-outlined">download</span>
            <span>Xuất dữ liệu</span>
          </button>
          <Link className="button button--primary" to="/doctor/profile">
            <span className="material-symbols-outlined">share</span>
            <span>Chia sẻ hồ sơ</span>
          </Link>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      <section className="doctor-review-hero">
        <article className="doctor-review-hero__score">
          <strong>{averageRating.toFixed(1)}</strong>
          <div className="doctor-review-hero__stars">{renderStars(averageRating)}</div>
          <span>Đánh giá trung bình</span>
          <small>{reviews.length} đánh giá</small>
        </article>

        <div className="doctor-review-hero__metrics">
          <article className="doctor-review-metric doctor-review-metric--primary">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">thumb_up</span>
            </div>
            <div>
              <strong>{recommendationRate}%</strong>
              <span>Tỷ lệ đề xuất</span>
            </div>
          </article>

          <article className="doctor-review-metric doctor-review-metric--success">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <strong>{punctualityScore.toFixed(1)}/5</strong>
              <span>Điểm đúng giờ</span>
            </div>
          </article>

          <article className="doctor-review-metric doctor-review-metric--info">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">chat_bubble</span>
            </div>
            <div>
              <strong>{communicationScore.toFixed(1)}/5</strong>
              <span>Giao tiếp</span>
            </div>
          </article>
        </div>
      </section>

      <section className="doctor-review-toolbar">
        <div className="doctor-review-toolbar__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`doctor-review-filter${
                activeFilter === filter ? " doctor-review-filter--active" : ""
              }`}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "ALL"
                ? "Tất cả đánh giá"
                : filter === "POSITIVE"
                  ? "Tích cực"
                  : "Cần chú ý"}
            </button>
          ))}
        </div>

        <div className="doctor-review-toolbar__controls">
          <label className="doctor-topbar__search doctor-topbar__search--compact">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Tìm đánh giá, bệnh nhân hoặc từ khóa..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="doctor-review-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="recent">Mới nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </section>

      <section className="doctor-review-feed">
        {loading ? (
          <p className="empty-state">Đang tải đánh giá...</p>
        ) : filteredReviews.length === 0 ? (
          <p className="empty-state">Không tìm thấy đánh giá phù hợp bộ lọc.</p>
        ) : (
          filteredReviews.map((review) => {
            const rating = Number(review.rating ?? 0);

            return (
              <article className="doctor-review-card" key={review.id}>
                <div className="doctor-review-card__patient">
                  <div className="doctor-review-card__avatar">
                    {getInitials(review.patientName)}
                  </div>
                  <strong>{review.patientName || "Ẩn danh"}</strong>
                  <span>Bệnh nhân đã xác thực</span>
                </div>

                <div className="doctor-review-card__body">
                  <div className="doctor-review-card__head">
                    <div>
                      <div className="doctor-review-card__stars">{renderStars(rating)}</div>
                      <div className="doctor-review-card__meta">
                        <strong>{rating.toFixed(1)}</strong>
                        <span>Lịch hẹn #{review.appointmentId ?? "--"}</span>
                      </div>
                    </div>

                    <span
                      className={`doctor-review-card__badge${
                        rating >= 4
                          ? " doctor-review-card__badge--positive"
                          : " doctor-review-card__badge--critical"
                      }`}
                    >
                      {rating >= 4 ? "Hài lòng" : "Cần chú ý"}
                    </span>
                  </div>

                  <p className="doctor-review-card__comment">
                    {review.comment || "Bệnh nhân chưa để lại bình luận."}
                  </p>

                  <div className="doctor-review-card__actions">
                    <button className="doctor-text-button" type="button">
                      <span className="material-symbols-outlined">reply</span>
                      <span>Phản hồi</span>
                    </button>
                    <button className="doctor-text-button" type="button">
                      <span className="material-symbols-outlined">flag</span>
                      <span>Báo cáo</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {!loading && filteredReviews.length > 0 ? (
        <footer className="doctor-review-feed__footer">
          <p>
            Hiển thị <strong>{filteredReviews.length}</strong> trong <strong>{reviews.length}</strong>{" "}
            đánh giá của {doctor?.fullName || "bác sĩ này"}
          </p>
        </footer>
      ) : null}
    </DoctorWorkspace>
  );
}
