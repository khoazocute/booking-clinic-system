import { AdminWorkspace } from "../../layouts/AdminWorkspace";

export function AdminReviewsPage() {
  return (
    <AdminWorkspace eyebrow="Admin / Đánh giá" title="Quản lý đánh giá">
      <div className="admin-coming-soon">
        <span className="material-symbols-outlined">star</span>
        <h2>Đánh giá</h2>
        <p>Trang này đang được phát triển bởi Đăng.</p>
      </div>
    </AdminWorkspace>
  );
}
