import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createReview,
  getAppointmentById,
} from "../../../services/patientPortalService";
import {
  PatientPageShell,
  PatientStatusBadge,
  formatDate,
  formatTime,
} from "../portal/patientPortalUtils";

export function CreateReviewPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAppointmentById(appointmentId)
      .then((response) => {
        if (active) setAppointment(response?.data ?? null);
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
  }, [appointmentId]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await createReview({
        appointmentId: Number(appointmentId),
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

  const canReview = appointment?.status === "COMPLETED";

  return (
    <PatientPageShell
      eyebrow="Patient Portal / Review"
      title="Viet danh gia"
      description="Chia se trai nghiem sau khi lich kham da hoan thanh."
      actions={<Link className="mc-btn mc-btn--outline" to="/reviews">Danh sach danh gia</Link>}
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai thong tin lich kham...</p></div>
      ) : appointment ? (
        <div className="patient-detail-layout">
          <section className="patient-detail-main">
            <article className="patient-panel">
              <div className="patient-panel__head">
                <div>
                  <h2>{appointment.doctorName}</h2>
                  <p>{formatDate(appointment.appointmentDate)} - {formatTime(appointment.startTime)}</p>
                </div>
                <PatientStatusBadge status={appointment.status} />
              </div>

              {!canReview ? (
                <p className="patient-alert patient-alert--error">
                  Ban chi co the danh gia sau khi lich kham da hoan thanh.
                </p>
              ) : null}

              <form className="patient-form" onSubmit={handleSubmit}>
                <label>
                  <span>So sao</span>
                  <select value={rating} onChange={(event) => setRating(event.target.value)} disabled={!canReview}>
                    <option value="5">5 sao - Rat hai long</option>
                    <option value="4">4 sao - Hai long</option>
                    <option value="3">3 sao - Binh thuong</option>
                    <option value="2">2 sao - Chua tot</option>
                    <option value="1">1 sao - Khong hai long</option>
                  </select>
                </label>
                <label>
                  <span>Nhan xet</span>
                  <textarea
                    rows={6}
                    placeholder="Nhap cam nhan cua ban ve bac si va buoi kham..."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={!canReview}
                  />
                </label>
                <div className="patient-card-actions">
                  <Link className="mc-btn mc-btn--outline" to={`/my-appointments/${appointment.id}`}>
                    Quay lai lich hen
                  </Link>
                  <button className="mc-btn mc-btn--primary" disabled={!canReview || submitting} type="submit">
                    {submitting ? "Dang gui..." : "Gui danh gia"}
                  </button>
                </div>
              </form>
            </article>
          </section>
        </div>
      ) : (
        <div className="mc-state"><p>Khong tim thay lich hen.</p></div>
      )}
    </PatientPageShell>
  );
}
