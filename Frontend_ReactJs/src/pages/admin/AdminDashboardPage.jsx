import { AdminWorkspace } from "../../layouts/AdminWorkspace";

export function AdminDashboardPage() {
  return (
    <AdminWorkspace
      eyebrow="Admin / Dashboard"
      title="Tổng quan hệ thống"
      description="Theo dõi hoạt động và số liệu tổng quan của phòng khám."
    >
      <div className="admin-coming-soon">
        <span className="material-symbols-outlined">dashboard</span>
        <h2>Dashboard</h2>
        <p>Trang này đang được phát triển bởi Khoa.</p>
      </div>
    </AdminWorkspace>
  );
}
