import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyAppointments,
  getReviewsByDoctor,
} from "../../../services/patientPortalService";
import {
  EmptyState,
  PatientPageShell,
  formatDate,
  formatDateTime,
  formatTime,
} from "../portal/patientPortalUtils";

export function MyReviewsPage() {
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await getMyAppointments();
        const appointmentItems = response?.data ?? [];
        const completed = appointmentItems.filter((item) => item.status === "COMPLETED");
        const doctorIds = [...new Set(completed.map((item) => item.doctorId).filter(Boolean))];
        const reviewResults = await Promise.allSettled(doctorIds.map((id) => getReviewsByDoctor(id)));
        const allReviews = reviewResults
          .filter((item) => item.status === "fulfilled")
          .flatMap((item) => item.value)
          .filter((review) => completed.some((appointment) => appointment.id === review.appointmentId));

        if (active) {
          setAppointments(completed);
          setReviews(allReviews);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      active = false;
    };
  }, []);

  const reviewedAppointmentIds = useMemo(
    () => new Set(reviews.map((review) => review.appointmentId)),
    [reviews],
  );
  const pendingReviews = appointments.filter((item) => !reviewedAppointmentIds.has(item.id));

  return (
    <PatientPageShell
      eyebrow="Patient Portal"
      title="Danh gia cua toi"
      description="Viet danh gia cho cac buoi kham da hoan thanh va cap nhat nhan xet da gui."
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Dang tai danh gia...</p></div>
      ) : (
        <div className="patient-review-grid">
          <section className="patient-panel">
            <div className="patient-panel__head">
              <div>
                <h2>Co the danh gia</h2>
                <p>Cac lich kham da hoan thanh nhung chua co review.</p>
              </div>
            </div>
            {pendingReviews.length === 0 ? (
              <EmptyState icon="rate_review" title="Khong co lich can danh gia" />
            ) : (
              <div className="patient-mini-list">
                {pendingReviews.map((appointment) => (
                  <article className="patient-mini-card" key={appointment.id}>
                    <div>
                      <h3>{appointment.doctorName}</h3>
                      <p>{formatDate(appointment.appointmentDate)} - {formatTime(appointment.startTime)}</p>
                    </div>
                    <Link className="mc-btn mc-btn--primary" to={`/reviews/create/${appointment.id}`}>
                      Viet danh gia
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="patient-panel">
            <div className="patient-panel__head">
              <div>
                <h2>Da danh gia</h2>
                <p>Cac nhan xet ban da gui cho bac si.</p>
              </div>
            </div>
            {reviews.length === 0 ? (
              <EmptyState icon="star" title="Chua co danh gia nao" />
            ) : (
              <div className="patient-mini-list">
                {reviews.map((review) => (
                  <article className="patient-mini-card" key={review.id}>
                    <div>
                      <h3>{review.doctorName}</h3>
                      <p>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                      <small>{formatDateTime(review.createdAt)}</small>
                      {review.comment ? <p>{review.comment}</p> : null}
                    </div>
                    <Link className="mc-btn mc-btn--outline" to={`/reviews/${review.id}/edit`}>
                      Sua
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PatientPageShell>
  );
}
