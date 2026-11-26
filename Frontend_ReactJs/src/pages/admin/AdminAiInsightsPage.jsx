import { useCallback, useEffect, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import {
  getAiConversationTrace,
  getAiConversations,
  getAiMetrics,
} from "../../services/aiConsultationService";

const RANGES = [
  { days: 1, label: "Hôm nay" },
  { days: 7, label: "7 ngày" },
  { days: 30, label: "30 ngày" },
];

const FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "DOWNVOTED", label: "Bị chê" },
  { value: "HANDOFF", label: "Gợi ý gặp người thật" },
  { value: "EMERGENCY", label: "Cấp cứu" },
  { value: "DEGRADED", label: "Chế độ dự phòng" },
  { value: "BLOCKED", label: "Bị chặn đầu ra" },
];

const TOOL_NAMES = {
  search_clinic_knowledge: "Tra cứu quy định (RAG)",
  suggest_specialty: "Gợi ý chuyên khoa",
  find_doctors: "Tìm bác sĩ",
  get_available_slots: "Xem lịch trống",
  propose_booking: "Đề xuất đặt lịch",
  offer_human_support: "Đề nghị gặp người thật",
};

const pct = (value) => (value == null ? "--" : `${Math.round(value * 100)}%`);
const vnd = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
const seconds = (ms) => (ms ? `${(ms / 1000).toFixed(1)} s` : "--");

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function StatTile({ label, value, hint }) {
  return (
    <div className="ai-ops-tile">
      <span className="ai-ops-tile__label">{label}</span>
      <strong className="ai-ops-tile__value">{value}</strong>
      {hint ? <span className="ai-ops-tile__hint">{hint}</span> : null}
    </div>
  );
}

/** Single-series column chart: one hue, thin rounded columns on a shared baseline, tooltip per column. */
function DailyColumns({ points, value, format, title }) {
  const max = Math.max(1, ...points.map(value));
  return (
    <figure className="ai-ops-chart">
      <figcaption>{title}</figcaption>
      <div className="ai-ops-columns" role="img" aria-label={title}>
        {points.map((p) => {
          const v = value(p);
          const day = new Date(p.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
          return (
            <div className="ai-ops-column" key={p.date} tabIndex={0}>
              <div className="ai-ops-column__bar" style={{ height: `${(v / max) * 100}%` }} />
              <div className="ai-ops-tooltip" role="tooltip">
                <strong>{day}</strong>
                <span>{format(v)}</span>
              </div>
              {points.length <= 14 ? <span className="ai-ops-column__label">{day}</span> : null}
            </div>
          );
        })}
      </div>
    </figure>
  );
}

function ToolBars({ usage }) {
  const entries = Object.entries(usage ?? {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (entries.length === 0) return <p className="admin-empty">Chưa có lượt gọi công cụ.</p>;
  return (
    <figure className="ai-ops-chart">
      <figcaption>Công cụ agent đã gọi</figcaption>
      <ul className="ai-ops-hbars">
        {entries.map(([tool, n]) => (
          <li key={tool}>
            <span className="ai-ops-hbars__name">{TOOL_NAMES[tool] ?? tool}</span>
            <span className="ai-ops-hbars__track">
              <span className="ai-ops-hbars__bar" style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="ai-ops-hbars__value">{n}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Flags({ c }) {
  const flags = [
    c.emergency && { icon: "emergency", label: "Cấp cứu", tone: "critical" },
    c.downvotes > 0 && { icon: "thumb_down", label: `${c.downvotes} chê`, tone: "serious" },
    c.handoff && { icon: "support_agent", label: "Gặp người thật", tone: "warning" },
    c.degraded && { icon: "cloud_off", label: "Dự phòng", tone: "neutral" },
    c.outputBlocked && { icon: "block", label: "Chặn đầu ra", tone: "serious" },
    c.upvotes > 0 && { icon: "thumb_up", label: `${c.upvotes} khen`, tone: "good" },
  ].filter(Boolean);
  return (
    <span className="ai-ops-flags">
      {flags.map((f) => (
        <span key={f.label} className={`ai-ops-flag ai-ops-flag--${f.tone}`}>
          <span className="material-symbols-outlined">{f.icon}</span>
          {f.label}
        </span>
      ))}
    </span>
  );
}

function Trace({ trace, onClose }) {
  return (
    <section className="admin-table-card ai-ops-trace">
      <header className="ai-ops-trace__head">
        <div>
          <strong>{trace.patientName}</strong>
          <span>
            Hội thoại #{trace.id} · {formatDateTime(trace.startedAt)}
          </span>
        </div>
        <button type="button" className="button button--ghost" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
          Đóng
        </button>
      </header>
      <ol className="ai-ops-trace__list">
        {trace.messages.map((m) => (
          <li key={m.id} className={`ai-ops-turn ai-ops-turn--${m.role}`}>
            <p>{m.content}</p>
            {m.role === "assistant" ? (
              <div className="ai-ops-turn__meta">
                <span>{m.source}</span>
                {m.model ? <span>{m.model}</span> : null}
                <span>{seconds(m.latencyMs)}</span>
                {m.promptTokens != null ? (
                  <span>
                    {m.promptTokens} + {m.completionTokens} token
                  </span>
                ) : null}
                {m.toolCalls.length > 0 ? <span>Công cụ: {m.toolCalls.map((t) => TOOL_NAMES[t] ?? t).join(" → ")}</span> : null}
                {m.citations.length > 0 ? <span>Nguồn: {m.citations.join(", ")}</span> : null}
                {m.emergencyCategory ? <span className="ai-ops-flag ai-ops-flag--critical">Cấp cứu: {m.emergencyCategory}</span> : null}
                {m.outputBlocked ? <span className="ai-ops-flag ai-ops-flag--serious">Đầu ra bị chặn</span> : null}
                {m.feedback ? (
                  <span className={`ai-ops-flag ai-ops-flag--${m.feedback === "UP" ? "good" : "serious"}`}>
                    <span className="material-symbols-outlined">{m.feedback === "UP" ? "thumb_up" : "thumb_down"}</span>
                    {m.feedbackComment || (m.feedback === "UP" ? "Hữu ích" : "Chưa tốt")}
                  </span>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AdminAiInsightsPage() {
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState("ALL");
  const [metrics, setMetrics] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([getAiMetrics(days), getAiConversations(filter, days)]);
      setMetrics(m?.data ?? null);
      setConversations(c?.data ?? []);
      setError("");
    } catch (requestError) {
      setError(requestError.message ?? "Không tải được số liệu AI.");
    } finally {
      setLoading(false);
    }
  }, [days, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function openTrace(id) {
    try {
      const response = await getAiConversationTrace(id);
      setTrace(response?.data ?? null);
    } catch (requestError) {
      setError(requestError.message ?? "Không tải được hội thoại.");
    }
  }

  const m = metrics;

  return (
    <AdminWorkspace
      eyebrow="Admin / Chất lượng AI"
      title="Theo dõi trợ lý AI"
      description="Chất lượng, chi phí, độ trễ và an toàn của trợ lý, tính từ từng lượt trò chuyện đã lưu."
      actions={
        <div className="ai-ops-actions">
          <div className="admin-filter-tabs">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                className={`admin-filter-tab${days === r.days ? " admin-filter-tab--active" : ""}`}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="button button--ghost" type="button" onClick={load}>
            <span className="material-symbols-outlined">refresh</span>
            Làm mới
          </button>
        </div>
      }
    >
      {error ? (
        <div className="admin-alert admin-alert--error">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      ) : null}

      {loading && !m ? <div className="admin-empty">Đang tải...</div> : null}

      {m ? (
        <>
          <section className="ai-ops-tiles" aria-label="Chỉ số tổng quan">
            <StatTile label="Lượt trả lời" value={m.turns.toLocaleString("vi-VN")}
                      hint={`${m.conversations} hội thoại · ${m.uniquePatients} bệnh nhân`} />
            <StatTile label="Hài lòng" value={pct(m.satisfactionRate)}
                      hint={`${m.feedbackUp} khen · ${m.feedbackDown} chê`} />
            <StatTile label="Độ trễ" value={seconds(m.avgLatencyMs)} hint={`p95 ${seconds(m.p95LatencyMs)}`} />
            <StatTile label="Chi phí ước tính" value={vnd(m.costVnd)}
                      hint={`${vnd(m.costPerTurnVnd)} / lượt · ${(m.promptTokens + m.completionTokens).toLocaleString("vi-VN")} token`} />
            <StatTile label="Agent trả lời" value={pct(m.answeredByAiRate)} hint={`dự phòng ${pct(m.degradedRate)}`} />
            <StatTile label="Gợi ý gặp người thật" value={pct(m.handoffSuggestedRate)}
                      hint={`${m.supportTickets} yêu cầu hỗ trợ được tạo`} />
            <StatTile label="An toàn" value={`${m.emergencies} cấp cứu`}
                      hint={`${m.outputBlocked} câu trả lời bị chặn đầu ra`} />
            <StatTile label="Nhân viên dùng bản nháp AI" value={pct(m.aiDraftUsedRate)}
                      hint={`${m.staffReplies} câu trả lời hỗ trợ`} />
          </section>

          <section className="ai-ops-charts">
            <div className="admin-table-card ai-ops-card">
              <DailyColumns points={m.daily} value={(p) => p.turns} format={(v) => `${v} lượt`}
                            title="Lượt trả lời theo ngày" />
            </div>
            <div className="admin-table-card ai-ops-card">
              <ToolBars usage={m.toolUsage} />
            </div>
          </section>
          <p className="ai-ops-note">{m.pricingNote}. Độ trễ tính từ backend, gồm cả các lần gọi công cụ.</p>
        </>
      ) : null}

      {trace ? <Trace trace={trace} onClose={() => setTrace(null)} /> : null}

      <section className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-filter-tabs ai-ops-filters">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`admin-filter-tab${filter === f.value ? " admin-filter-tab--active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {conversations.length === 0 ? (
          <div className="admin-empty">Không có hội thoại nào.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bệnh nhân</th>
                  <th>Câu hỏi đầu</th>
                  <th>Lượt</th>
                  <th>Độ trễ TB</th>
                  <th>Chi phí</th>
                  <th>Tín hiệu</th>
                  <th>Lần cuối</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id}>
                    <td className="admin-table__id">#{c.id}</td>
                    <td>{c.patientName}</td>
                    <td className="ai-ops-title">{c.title}</td>
                    <td>{c.turns}</td>
                    <td>{seconds(c.avgLatencyMs)}</td>
                    <td>{vnd(c.costVnd)}</td>
                    <td><Flags c={c} /></td>
                    <td>{formatDateTime(c.lastAt)}</td>
                    <td>
                      <button type="button" className="button button--ghost" onClick={() => openTrace(c.id)}>
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminWorkspace>
  );
}
