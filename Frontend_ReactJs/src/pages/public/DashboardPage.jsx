import { SectionCard } from "../../components/common/SectionCard";
import { useApiStatus } from "../../hooks/useApiStatus";

const roadmapItems = [
  "Thêm module xác thực bằng JWT và bảo vệ route.",
  "Xây dựng tính năng bác sĩ, bệnh nhân và lịch hẹn theo cùng cấu trúc thư mục.",
  "Thay dashboard demo bằng số liệu thật từ API backend."
];

export function DashboardPage() {
  const { status, loading, error, backendInfo } = useApiStatus();

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Khởi tạo dự án</p>
        <h2>Nền tảng fullstack hiện đại cho hệ thống đặt lịch phòng khám</h2>
        <p className="hero-copy">
          Backend và frontend được tách rõ ràng để mỗi phần có thể phát triển
          độc lập nhưng vẫn kết nối qua REST API.
        </p>
      </section>

      <div className="grid-two">
        <SectionCard
          title="Trạng thái backend"
          description="Kiểm tra endpoint health của Spring Boot"
        >
          <p className={`status-pill status-${status.toLowerCase()}`}>
            {loading ? "Đang kiểm tra..." : status}
          </p>
          <p className="muted-text">
            {error || backendInfo || "Cập nhật VITE_API_BASE_URL nếu backend chạy ở địa chỉ khác."}
          </p>
        </SectionCard>

        <SectionCard
          title="Module gợi ý tiếp theo"
          description="Lộ trình đề xuất cho kiến trúc hiện tại"
        >
          <ul className="feature-list">
            {roadmapItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
