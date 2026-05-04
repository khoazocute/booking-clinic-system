import { SectionCard } from "../../components/common/SectionCard";
import { useApiStatus } from "../../hooks/useApiStatus";

const roadmapItems = [
  "Add auth module with JWT and route protection.",
  "Create doctor, patient, and appointment features by following the same folder pattern.",
  "Replace demo dashboard cards with real analytics from backend APIs."
];

export function DashboardPage() {
  const { status, loading, error, backendInfo } = useApiStatus();

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Project starter</p>
        <h2>Modern fullstack foundation for your clinic booking project</h2>
        <p className="hero-copy">
          Backend and frontend are separated cleanly so each side can grow
          independently while still connecting through REST APIs.
        </p>
      </section>

      <div className="grid-two">
        <SectionCard
          title="Backend status"
          description="Checking Spring Boot health endpoint"
        >
          <p className={`status-pill status-${status.toLowerCase()}`}>
            {loading ? "Checking..." : status}
          </p>
          <p className="muted-text">
            {error || backendInfo || "Update VITE_API_BASE_URL if your backend runs elsewhere."}
          </p>
        </SectionCard>

        <SectionCard
          title="Suggested next modules"
          description="Recommended roadmap for this architecture"
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
