import { useCallback, useEffect, useRef, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import { useSupportSocket } from "../../hooks/useSupportSocket";
import {
  closeSupportTicket,
  getSupportAssist,
  getSupportTicket,
  listSupportTickets,
  sendSupportMessage,
} from "../../services/supportService";

const POLL_MS = 20000;

const FILTERS = [
  { value: "OPEN", label: "Đang mở" },
  { value: "WAITING_STAFF", label: "Chờ phản hồi" },
  { value: "ANSWERED", label: "Đã trả lời" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "ALL", label: "Tất cả" },
];

const STATUS = {
  WAITING_STAFF: { label: "Chờ phản hồi", className: "admin-support-badge--waiting" },
  ANSWERED: { label: "Đã trả lời", className: "admin-support-badge--answered" },
  CLOSED: { label: "Đã đóng", className: "admin-support-badge--closed" },
};

const REASONS = {
  PATIENT_REQUEST: "Bệnh nhân yêu cầu",
  COMPLAINT: "Phàn nàn",
  PAYMENT_ISSUE: "Sự cố thanh toán",
  OUT_OF_SCOPE: "Ngoài khả năng của AI",
  AGENT_GAVE_UP: "AI không trả lời được",
  AI_UNAVAILABLE: "AI tạm gián đoạn",
};

function timeAgo(value) {
  if (!value) return "";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (Number.isNaN(minutes)) return "";
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} giờ trước`;
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function StatusBadge({ status }) {
  const meta = STATUS[status] ?? { label: status, className: "" };
  return <span className={`admin-support-badge ${meta.className}`}>{meta.label}</span>;
}

export function AdminSupportPage() {
  const [filter, setFilter] = useState("OPEN");
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [assist, setAssist] = useState(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [usedDraft, setUsedDraft] = useState(false);
  const endRef = useRef(null);

  const loadTickets = useCallback(async () => {
    try {
      const response = await listSupportTickets(filter);
      setTickets(response?.data ?? []);
      setError("");
    } catch (requestError) {
      setError(requestError.message ?? "Không tải được danh sách yêu cầu hỗ trợ.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await getSupportTicket(id);
      setDetail(response?.data ?? null);
    } catch (requestError) {
      setError(requestError.message ?? "Không tải được yêu cầu hỗ trợ.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTickets();
    const timer = setInterval(loadTickets, POLL_MS);
    return () => clearInterval(timer);
  }, [loadTickets]);

  useEffect(() => {
    setShowTranscript(true);
    setAssist(null);
    setUsedDraft(false);
    setReply("");
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleAssist() {
    if (!detail || assistLoading) return;
    setAssistLoading(true);
    try {
      const response = await getSupportAssist(detail.id);
      const data = response?.data ?? null;
      setAssist(data);
      if (data?.suggestedReply && !reply.trim()) {
        setReply(data.suggestedReply);
        setUsedDraft(true);
      }
    } catch (requestError) {
      setError(requestError.message ?? "Không lấy được gợi ý AI.");
    } finally {
      setAssistLoading(false);
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail?.messages?.length]);

  useSupportSocket((event) => {
    loadTickets();
    if (event.ticketId !== selectedId) return;
    if (event.type === "MESSAGE" && event.message) {
      setDetail((current) => {
        if (!current || current.messages.some((m) => m.id === event.message.id)) return current;
        return { ...current, status: event.status, messages: [...current.messages, event.message] };
      });
    } else {
      loadDetail(selectedId);
    }
  });

  async function handleReply(event) {
    event.preventDefault();
    const content = reply.trim();
    if (!content || !detail || busy) return;
    setBusy(true);
    try {
      const response = await sendSupportMessage(detail.id, content, usedDraft);
      const message = response?.data;
      setReply("");
      setUsedDraft(false);
      setAssist(null);
      setDetail((current) => ({
        ...current,
        status: "ANSWERED",
        messages: current.messages.some((m) => m.id === message?.id) ? current.messages : [...current.messages, message],
      }));
      loadTickets();
    } catch (requestError) {
      setError(requestError.message ?? "Không gửi được trả lời.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const response = await closeSupportTicket(detail.id);
      setDetail(response?.data ?? { ...detail, status: "CLOSED" });
      loadTickets();
    } catch (requestError) {
      setError(requestError.message ?? "Không đóng được yêu cầu.");
    } finally {
      setBusy(false);
    }
  }

  const waitingCount = tickets.filter((t) => t.status === "WAITING_STAFF").length;

  return (
    <AdminWorkspace
      eyebrow="Admin / Hỗ trợ"
      title="Hỗ trợ bệnh nhân"
      description="Bệnh nhân được chuyển từ trợ lý AI sang nhân viên. Yêu cầu đang chờ phản hồi được xếp lên đầu."
      actions={
        <button className="button button--ghost" type="button" onClick={loadTickets}>
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

      <div className="admin-support">
        <section className="admin-table-card admin-support__list">
          <div className="admin-table-toolbar">
            <div className="admin-filter-tabs admin-support__filters">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`admin-filter-tab${filter === f.value ? " admin-filter-tab--active" : ""}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                  {f.value === "OPEN" && filter === "OPEN" && waitingCount > 0 ? (
                    <span className="admin-filter-tab__count">{waitingCount}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {loading ? <div className="admin-empty">Đang tải...</div> : null}
          {!loading && tickets.length === 0 ? <div className="admin-empty">Không có yêu cầu nào.</div> : null}

          <ul className="admin-support__items">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`admin-support__item${t.id === selectedId ? " admin-support__item--active" : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="admin-support__item-head">
                    <strong>{t.patientName}</strong>
                    <StatusBadge status={t.status} />
                  </div>
                  <p>{t.lastMessage}</p>
                  <small>
                    #{t.id} · {REASONS[t.reason] ?? t.reason} · {timeAgo(t.updatedAt)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-table-card admin-support__detail">
          {!detail ? (
            <div className="admin-empty">Chọn một yêu cầu để xem và trả lời.</div>
          ) : (
            <>
              <header className="admin-support__detail-head">
                <div>
                  <strong>{detail.patientName}</strong>
                  <span>
                    {detail.patientEmail}
                    {detail.patientPhone ? ` · ${detail.patientPhone}` : ""}
                  </span>
                  <span>
                    #{detail.id} · {REASONS[detail.reason] ?? detail.reason} · mở lúc {formatDateTime(detail.createdAt)}
                    {detail.assignedStaffName ? ` · phụ trách: ${detail.assignedStaffName}` : ""}
                  </span>
                </div>
                <div className="admin-support__detail-actions">
                  <StatusBadge status={detail.status} />
                  {detail.status !== "CLOSED" ? (
                    <button type="button" className="button button--ghost" onClick={handleClose} disabled={busy}>
                      <span className="material-symbols-outlined">task_alt</span>
                      Đóng yêu cầu
                    </button>
                  ) : null}
                </div>
              </header>

              {detail.aiTranscript ? (
                <div className="admin-support__transcript">
                  <button type="button" onClick={() => setShowTranscript((v) => !v)}>
                    <span className="material-symbols-outlined">smart_toy</span>
                    Trò chuyện với trợ lý AI trước khi chuyển (bệnh nhân đồng ý chia sẻ)
                    <span className="material-symbols-outlined">{showTranscript ? "expand_less" : "expand_more"}</span>
                  </button>
                  {showTranscript ? <pre>{detail.aiTranscript}</pre> : null}
                </div>
              ) : (
                <p className="admin-support__no-transcript">Bệnh nhân không chia sẻ cuộc trò chuyện với trợ lý AI.</p>
              )}

              <div className="admin-support__thread">
                {detail.messages.map((m) => (
                  <div key={m.id} className={`admin-support__msg admin-support__msg--${m.senderRole.toLowerCase()}`}>
                    <span>
                      {m.senderName} · {formatDateTime(m.createdAt)}
                    </span>
                    <p>{m.content}</p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {detail.status !== "CLOSED" && assist ? (
                <div className="admin-support__assist">
                  <strong>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Tóm tắt của AI
                  </strong>
                  <pre>{assist.summary || "(không có tóm tắt)"}</pre>
                  {assist.sources?.length ? (
                    <small>Căn cứ: {assist.sources.map((s) => `[${s.ref}] ${s.title}`).join("; ")}</small>
                  ) : null}
                  {assist.outputBlocked ? (
                    <small className="admin-support__assist-warn">Bản nháp chứa thông tin thuốc nên đã bị loại, vui lòng tự soạn.</small>
                  ) : (
                    <small>Bản nháp đã được điền vào ô trả lời. Hãy kiểm tra và thay các chỗ [trong ngoặc vuông] trước khi gửi.</small>
                  )}
                </div>
              ) : null}

              {detail.status !== "CLOSED" ? (
                <form className="admin-support__reply" onSubmit={handleReply}>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={reply}
                    onChange={(event) => {
                      setReply(event.target.value);
                      if (!event.target.value.trim()) setUsedDraft(false);
                    }}
                    placeholder="Trả lời bệnh nhân..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) handleReply(event);
                    }}
                  />
                  <div className="admin-support__reply-actions">
                    <button type="button" className="button button--ghost" onClick={handleAssist} disabled={assistLoading}>
                      <span className="material-symbols-outlined">auto_awesome</span>
                      {assistLoading ? "Đang soạn..." : "AI gợi ý"}
                    </button>
                    <button type="submit" className="button button--primary" disabled={busy || !reply.trim()}>
                      <span className="material-symbols-outlined">send</span>
                      Gửi
                    </button>
                  </div>
                </form>
              ) : (
                <p className="admin-support__no-transcript">Yêu cầu đã đóng lúc {formatDateTime(detail.closedAt)}.</p>
              )}
            </>
          )}
        </section>
      </div>
    </AdminWorkspace>
  );
}
