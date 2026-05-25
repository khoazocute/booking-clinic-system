import { useEffect, useMemo, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import { getAdminReviews } from "../../services/adminReviewService";

const PAGE_SIZE = 8;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
}

function truncate(text, maxLength = 72) {
  const raw = String(text ?? "").trim();
  if (raw.length <= maxLength) return raw || "--";
  return `${raw.slice(0, maxLength - 3)}...`;
}

function stars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(toNumber(rating))));
  return Array.from({ length: 5 }).map((_, index) => index < n);
}

export function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [reviews, setReviews] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);

  async function loadData() {
    setLoading(true);
    setError("");
    setWarning("");
    try {
      const data = await getAdminReviews();
      setDoctors(data.doctors);
      setReviews(data.reviews);
      if (data.failedDoctorCount > 0) {
        setWarning(`Không tải được review của ${data.failedDoctorCount} bác sĩ.`);
      }
    } catch (requestError) {
      setError(requestError.message ?? "Không thể tải dữ liệu đánh giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredReviews = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return reviews.filter((review) => {
      if (doctorFilter !== "ALL" && String(review.doctorId) !== doctorFilter) return false;

      const rating = Math.round(toNumber(review.rating));
      if (ratingFilter !== "ALL") {
        if (ratingFilter === "LOW" && rating >= 3) return false;
        if (ratingFilter !== "LOW" && rating !== Number(ratingFilter)) return false;
      }

      if (!keyword) return true;

      const textBlock = [
        review.doctorName,
        review.patientName,
        review.comment,
        review.doctorSpecialty,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return textBlock.includes(keyword);
    });
  }, [reviews, doctorFilter, ratingFilter, searchKeyword]);

  useEffect(() => {
    setPage(1);
  }, [doctorFilter, ratingFilter, searchKeyword]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, critical: 0, recent: 0 };
    const total = reviews.length;
    const sum = reviews.reduce((acc, item) => acc + toNumber(item.rating), 0);
    const critical = reviews.filter((item) => toNumber(item.rating) <= 2).length;
    const now = Date.now();
    const recent = reviews.filter((item) => {
      const time = new Date(item.createdAt ?? 0).getTime();
      if (!time) return false;
      return now - time <= 24 * 60 * 60 * 1000;
    }).length;
    return {
      avg: sum / total,
      total,
      critical,
      recent,
    };
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedReviews = filteredReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <AdminWorkspace
      eyebrow="Admin / Đánh giá"
      title="Phản hồi bệnh nhân"
      description="Theo dõi đánh giá bệnh nhân theo bác sĩ và chất lượng dịch vụ."
      actions={
        <button className="button button--ghost" type="button" onClick={loadData}>
          <span className="material-symbols-outlined">refresh</span>
          Làm mới
        </button>
      }
    >
      {error ? (
        <div className="admin-alert admin-alert--error">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      ) : null}
      {warning ? (
        <div className="admin-alert" style={{ background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" }}>
          <span className="material-symbols-outlined">warning</span>
          <span>{warning}</span>
        </div>
      ) : null}

      <section className="admin-stats-row">
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Đánh giá trung bình</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.avg.toFixed(1)}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Tổng đánh giá</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.total}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Cảnh báo thấp</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.critical}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Mới trong 24h</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.recent}</p>
          </div>
        </div>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
            <span>Bác sĩ</span>
            <select
              value={doctorFilter}
              onChange={(event) => setDoctorFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">Tất cả bác sĩ</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName ?? `Bác sĩ #${doctor.id}`}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 180 }}>
            <span>Mức đánh giá</span>
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
              style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              <option value="ALL">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="LOW">Dưới 3 sao</option>
            </select>
          </label>

          <label className="admin-search-box" aria-label="Tìm review" style={{ minWidth: 280, marginLeft: "auto" }}>
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Tìm đánh giá, bệnh nhân hoặc bác sĩ..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bác sĩ</th>
                <th>Bệnh nhân</th>
                <th>Đánh giá</th>
                <th>Bình luận</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    Không có đánh giá phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                pagedReviews.map((review) => {
                  const ratingStates = stars(review.rating);
                  return (
                    <tr key={review.id}>
                      <td>#{review.id ?? "--"}</td>
                      <td>
                        <strong>{review.doctorName ?? "--"}</strong>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{review.doctorSpecialty ?? "--"}</div>
                      </td>
                      <td>{review.patientName ?? "--"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 2 }}>
                          {ratingStates.map((filled, idx) => (
                            <span
                              key={`${review.id}-star-${idx}`}
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 18,
                                color: filled ? "#f59e0b" : "#cbd5e1",
                                fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </td>
                      <td title={review.comment ?? ""}>{truncate(review.comment)}</td>
                      <td>{formatDate(review.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-toolbar" style={{ justifyContent: "space-between" }}>
          <span>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + (pagedReviews.length > 0 ? 1 : 0)}-
            {(currentPage - 1) * PAGE_SIZE + pagedReviews.length} trong {filteredReviews.length} đánh giá
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </AdminWorkspace>
  );
}
