import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getReviewById,
  updateReview,
} from "../../../services/patientPortalService";
import {
  PatientPageShell,
  formatDateTime,
} from "../portal/patientPortalUtils";

export function EditReviewPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getReviewById(reviewId)
      .then((data) => {
        if (!active) return;
        setReview(data);
        setRating(data?.rating ?? 5);
        setComment(data?.comment ?? "");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reviewId]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await updateReview(reviewId, {
        rating: Number(rating),
        comment: comment.trim() || null,
      });
      navigate("/reviews");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PatientPageShell
      eyebrow="Patient Portal / Review"
      title="Chinh sua danh gia"
      description="Cap nhat so sao va nhan xet cua ban."
      actions={<Link className="mc-btn mc-btn--outline" to="/reviews">Quay lai</Link>}
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai danh gia...</p></div>
      ) : review ? (
        <article className="patient-panel patient-narrow-panel">
          <div className="patient-panel__head">
            <div>
              <h2>{review.doctorName}</h2>
              <p>Da tao luc {formatDateTime(review.createdAt)}</p>
            </div>
          </div>

          <form className="patient-form" onSubmit={handleSubmit}>
            <label>
              <span>So sao</span>
              <select value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </label>
            <label>
              <span>Nhan xet</span>
              <textarea rows={6} value={comment} onChange={(event) => setComment(event.target.value)} />
            </label>
            <button className="mc-btn mc-btn--primary" disabled={submitting} type="submit">
              {submitting ? "Dang luu..." : "Luu thay doi"}
            </button>
          </form>
        </article>
      ) : (
        <div className="mc-state"><p>Khong tim thay danh gia.</p></div>
      )}
    </PatientPageShell>
  );
}
