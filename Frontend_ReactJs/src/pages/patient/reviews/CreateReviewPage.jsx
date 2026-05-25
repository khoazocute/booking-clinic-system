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
      title="Viết đánh giá "
      description="Chia sẻ trải nghiệm sau khi lịch khám đã hoàn thành."
      actions={<Link className="mc-btn mc-btn--outline" to="/reviews">Danh sách đánh giá</Link>}
    >
      {error ? <p className="patient-alert patient-alert--error">{error}</p> : null}
      {loading ? (
        <div className="mc-state"><p>Đang tải thông tin lịch khám...</p></div>
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
                  Bạn chỉ có thể đánh giá sau khi lịch khám đã hoàn thành.
                </p>
              ) : null}

              <form className="patient-form" onSubmit={handleSubmit}>
                <label>
                  <span>Số sao</span>
                  <select value={rating} onChange={(event) => setRating(event.target.value)} disabled={!canReview}>
                    <option value="5">5 sao - Rất hài lòng</option>
                    <option value="4">4 sao - Hài lòng</option>
                    <option value="3">3 sao - Bình thường</option>
                    <option value="2">2 sao - Chưa tốt</option>
                    <option value="1">1 sao - Không hài lòng</option>
                  </select>
                </label>
                <label>
                  <span>Nhận xét</span>
                  <textarea
                    rows={6}
                    placeholder="Nhập cảm nhận của bạn về bác sĩ và buổi khám..."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={!canReview}
                  />
                </label>
                <div className="patient-card-actions">
                  <Link className="mc-btn mc-btn--outline" to={`/my-appointments/${appointment.id}`}>
                    Quay lại lịch hẹn
                  </Link>
                  <button className="mc-btn mc-btn--primary" disabled={!canReview || submitting} type="submit">
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </form>
            </article>
          </section>
        </div>
      ) : (
        <div className="mc-state"><p>Không tìm thấy lịch hẹn.</p></div>
      )}
    </PatientPageShell>
  );
}
