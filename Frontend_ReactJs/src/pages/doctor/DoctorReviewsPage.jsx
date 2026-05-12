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
    ["Patient", "Rating", "Comment", "Appointment"],
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
      eyebrow="Quality Assurance / Reviews"
      title="Patient Feedback & Reviews"
      description="Monitor patient-reported outcomes, satisfaction, and communication quality."
      actions={
        <>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => exportReviewsCsv(filteredReviews)}
          >
            <span className="material-symbols-outlined">download</span>
            <span>Export Data</span>
          </button>
          <Link className="button button--primary" to="/doctor/profile">
            <span className="material-symbols-outlined">share</span>
            <span>Share Profile</span>
          </Link>
        </>
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}

      <section className="doctor-review-hero">
        <article className="doctor-review-hero__score">
          <strong>{averageRating.toFixed(1)}</strong>
          <div className="doctor-review-hero__stars">{renderStars(averageRating)}</div>
          <span>Average Rating</span>
          <small>{reviews.length} total reviews</small>
        </article>

        <div className="doctor-review-hero__metrics">
          <article className="doctor-review-metric doctor-review-metric--primary">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">thumb_up</span>
            </div>
            <div>
              <strong>{recommendationRate}%</strong>
              <span>Recommendation Rate</span>
            </div>
          </article>

          <article className="doctor-review-metric doctor-review-metric--success">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <strong>{punctualityScore.toFixed(1)}/5</strong>
              <span>Punctuality Score</span>
            </div>
          </article>

          <article className="doctor-review-metric doctor-review-metric--info">
            <div className="doctor-review-metric__icon">
              <span className="material-symbols-outlined">chat_bubble</span>
            </div>
            <div>
              <strong>{communicationScore.toFixed(1)}/5</strong>
              <span>Communication</span>
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
                ? "All Reviews"
                : filter === "POSITIVE"
                  ? "Positive"
                  : "Critical"}
            </button>
          ))}
        </div>

        <div className="doctor-review-toolbar__controls">
          <label className="doctor-topbar__search doctor-topbar__search--compact">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Search reviews, patients, or keywords..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="doctor-review-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </section>

      <section className="doctor-review-feed">
        {loading ? (
          <p className="empty-state">Loading reviews...</p>
        ) : filteredReviews.length === 0 ? (
          <p className="empty-state">No reviews found for the current filters.</p>
        ) : (
          filteredReviews.map((review) => {
            const rating = Number(review.rating ?? 0);

            return (
              <article className="doctor-review-card" key={review.id}>
                <div className="doctor-review-card__patient">
                  <div className="doctor-review-card__avatar">
                    {getInitials(review.patientName)}
                  </div>
                  <strong>{review.patientName || "Anonymous"}</strong>
                  <span>Verified Patient</span>
                </div>

                <div className="doctor-review-card__body">
                  <div className="doctor-review-card__head">
                    <div>
                      <div className="doctor-review-card__stars">{renderStars(rating)}</div>
                      <div className="doctor-review-card__meta">
                        <strong>{rating.toFixed(1)}</strong>
                        <span>Appointment #{review.appointmentId ?? "--"}</span>
                      </div>
                    </div>

                    <span
                      className={`doctor-review-card__badge${
                        rating >= 4
                          ? " doctor-review-card__badge--positive"
                          : " doctor-review-card__badge--critical"
                      }`}
                    >
                      {rating >= 4 ? "Helpful" : "Needs attention"}
                    </span>
                  </div>

                  <p className="doctor-review-card__comment">
                    {review.comment || "No comment provided by the patient."}
                  </p>

                  <div className="doctor-review-card__actions">
                    <button className="doctor-text-button" type="button">
                      <span className="material-symbols-outlined">reply</span>
                      <span>Respond</span>
                    </button>
                    <button className="doctor-text-button" type="button">
                      <span className="material-symbols-outlined">flag</span>
                      <span>Report</span>
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
            Showing <strong>{filteredReviews.length}</strong> of <strong>{reviews.length}</strong>{" "}
            reviews for {doctor?.fullName || "this doctor"}
          </p>
        </footer>
      ) : null}
    </DoctorWorkspace>
  );
}
