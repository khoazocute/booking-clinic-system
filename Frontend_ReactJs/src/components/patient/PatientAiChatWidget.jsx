import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getLatestConversation,
  sendAnswerFeedback,
  streamChatWithAssistant,
} from "../../services/aiConsultationService";
import { createAppointment } from "../../services/appointmentService";
import {
  closeSupportTicket,
  createSupportTicket,
  getMyActiveSupportTicket,
  getSupportTicket,
  sendSupportMessage,
} from "../../services/supportService";
import { useSupportSocket } from "../../hooks/useSupportSocket";

/** What the assistant is doing while a tool runs (streamed "status" events). */
const TOOL_LABELS = {
  search_clinic_knowledge: "Đang tra cứu quy định của phòng khám...",
  suggest_specialty: "Đang phân tích triệu chứng...",
  find_doctors: "Đang tìm bác sĩ phù hợp...",
  get_available_slots: "Đang xem lịch trống...",
  propose_booking: "Đang chuẩn bị đề xuất lịch khám...",
  offer_human_support: "Đang kết nối tư vấn viên...",
};

/** A server response (live or restored from history) as a chat item. */
function toAssistantItem(data, feedback = null) {
  return {
    role: "assistant",
    text: data.answer ?? "Xin lỗi, tôi chưa có câu trả lời.",
    messageId: data.messageId,
    feedback,
    emergency: data.emergency,
    citations: data.citations,
    doctors: data.doctors,
    slots: data.slots,
    bookingProposal: data.bookingProposal,
    suggestions: data.suggestions,
    degraded: data.degraded,
    handoffSuggested: data.handoffSuggested,
    handoffReason: data.handoffReason,
  };
}

const GREETING = {
  role: "assistant",
  text: "Xin chào! Tôi có thể gợi ý chuyên khoa theo triệu chứng, tìm bác sĩ, xem lịch trống và giải đáp quy định đặt lịch, huỷ lịch, thanh toán.",
  local: true,
};

const quickPrompts = [
  "Tôi bị đau họng, nghẹt mũi 3 ngày nay",
  "Huỷ lịch trước 12 tiếng có được hoàn tiền không?",
  "Bé nhà tôi 4 tuổi bị sốt, muốn đặt lịch khám",
];

function formatFee(fee) {
  if (fee == null) return "";
  return `${Number(fee).toLocaleString("vi-VN")} ₫`;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

const SUPPORT_POLL_MS = 15000;
const TRANSCRIPT_LIMIT = 20;

const SUPPORT_STATUS_TEXT = {
  WAITING_STAFF: "Đang chờ tư vấn viên phản hồi",
  ANSWERED: "Tư vấn viên đã trả lời",
  CLOSED: "Cuộc hỗ trợ đã kết thúc",
};

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function isOpenTicket(ticket) {
  return Boolean(ticket) && ticket.status !== "CLOSED";
}

function isLoggedIn() {
  try {
    return Boolean(localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
}

function EmergencyBanner({ emergency }) {
  return (
    <div className="patient-ai-emergency" role="alert">
      <span className="material-symbols-outlined">emergency</span>
      <div>
        <strong>Có thể là tình trạng cấp cứu</strong>
        <a href="tel:115">Gọi 115 ngay</a>
      </div>
      <small>{emergency.category}</small>
    </div>
  );
}

function AssistantExtras({ item, onSend, onConfirmBooking, onGoToPayment, onHandoff, disabled }) {
  const doctorName = (doctorId) =>
    item.doctors?.find((d) => d.id === doctorId)?.fullName ?? "bác sĩ đã chọn";

  return (
    <>
      {item.suggestions?.length > 0 ? (
        <div className="patient-ai-suggestions">
          {item.suggestions.slice(0, 3).map((s) => (
            <div className="patient-ai-suggestion" key={`s-${s.sourceId}`}>
              <div>
                <strong>{s.title}</strong>
                <span>Chuyên khoa</span>
              </div>
              <Link to={`/specialties/${s.sourceId}`}>Xem</Link>
            </div>
          ))}
        </div>
      ) : null}

      {item.doctors?.length > 0 ? (
        <div className="patient-ai-suggestions">
          {item.doctors.map((d) => (
            <div className="patient-ai-suggestion patient-ai-doctor" key={`d-${d.id}`}>
              <div>
                <strong>BS. {d.fullName}</strong>
                <span>
                  {d.specialtyName} · {formatFee(d.consultationFee)}
                  {d.clinicRoom ? ` · ${d.clinicRoom}` : ""}
                </span>
              </div>
              <div className="patient-ai-doctor__actions">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSend(`Cho tôi xem lịch trống của bác sĩ ${d.fullName} (mã bác sĩ ${d.id})`)}
                >
                  Lịch trống
                </button>
                <Link to={`/doctors/${d.id}`}>Hồ sơ</Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {item.slots?.length > 0 && !item.bookingProposal ? (
        <div className="patient-ai-slots">
          {item.slots.map((slot) => (
            <button
              type="button"
              key={slot.scheduleId}
              disabled={disabled}
              onClick={() =>
                onSend(
                  `Tôi chọn khung giờ ${slot.startTime} ngày ${formatDate(slot.workDate)} ` +
                    `(mã lịch ${slot.scheduleId}) với ${doctorName(slot.doctorId)} (mã bác sĩ ${slot.doctorId})`
                )
              }
            >
              {formatDate(slot.workDate)} · {slot.startTime}
            </button>
          ))}
        </div>
      ) : null}

      {item.bookingProposal ? (
        <div className="patient-ai-proposal">
          <span>{item.bookedAppointmentId ? "Đã giữ chỗ, chờ thanh toán" : "Đề xuất lịch khám (chưa đặt)"}</span>
          <strong>BS. {item.bookingProposal.doctorName}</strong>
          <p>
            {item.bookingProposal.specialtyName} · {formatDate(item.bookingProposal.workDate)}{" "}
            {item.bookingProposal.startTime}–{item.bookingProposal.endTime} ·{" "}
            {formatFee(item.bookingProposal.consultationFee)}
          </p>
          {item.bookedAppointmentId ? (
            <button type="button" onClick={() => onGoToPayment(item.bookingProposal, item.bookedAppointmentId)}>
              Thanh toán ngay
            </button>
          ) : (
            <button type="button" disabled={disabled} onClick={() => onConfirmBooking(item)}>
              Xác nhận đặt lịch &amp; thanh toán
            </button>
          )}
          {!item.bookedAppointmentId ? (
            <small>Bấm xác nhận để giữ chỗ. Bạn có 10 phút để thanh toán, quá hạn lịch tự huỷ.</small>
          ) : null}
        </div>
      ) : null}

      {item.citations?.length > 0 ? (
        <div className="patient-ai-citations">
          Nguồn:{" "}
          {item.citations.map((c) => (
            <span key={c.ref} title={c.sourceType}>
              [{c.ref}] {c.title}
            </span>
          ))}
        </div>
      ) : null}

      {item.degraded ? (
        <p className="patient-ai-degraded">Chế độ dự phòng: trợ lý AI đầy đủ đang tạm gián đoạn.</p>
      ) : null}

      {item.messageId ? <AnswerFeedback item={item} /> : null}

      {item.handoffSuggested ? (
        <button type="button" className="patient-ai-handoff-btn" onClick={() => onHandoff(item.handoffReason)}>
          <span className="material-symbols-outlined">support_agent</span>
          Gặp tư vấn viên
        </button>
      ) : null}
    </>
  );
}

/** Thumbs up / down on one answer: feeds the satisfaction metric on the admin AI dashboard. */
function AnswerFeedback({ item }) {
  const [rating, setRating] = useState(item.feedback ?? null);
  const [saving, setSaving] = useState(false);

  async function rate(value) {
    if (saving || rating === value) return;
    setSaving(true);
    try {
      await sendAnswerFeedback(item.messageId, value);
      setRating(value);
      item.feedback = value; // keep it if the list re-renders from the same object
    } catch {
      // feedback is best effort
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="patient-ai-feedback" aria-label="Đánh giá câu trả lời">
      {rating ? <span>{rating === "UP" ? "Cảm ơn bạn!" : "Cảm ơn, chúng tôi sẽ cải thiện."}</span> : null}
      <button
        type="button"
        className={rating === "UP" ? "is-active" : ""}
        onClick={() => rate("UP")}
        aria-label="Câu trả lời hữu ích"
        title="Hữu ích"
      >
        <span className="material-symbols-outlined">thumb_up</span>
      </button>
      <button
        type="button"
        className={rating === "DOWN" ? "is-active" : ""}
        onClick={() => rate("DOWN")}
        aria-label="Câu trả lời chưa tốt"
        title="Chưa tốt"
      >
        <span className="material-symbols-outlined">thumb_down</span>
      </button>
    </div>
  );
}

/** The patient decides what staff see: the request text, and the AI chat only if they tick the box. */
function HandoffForm({ draft, setDraft, transcriptCount, onSubmit, onCancel, busy }) {
  return (
    <form className="patient-support-handoff" onSubmit={onSubmit}>
      <strong>Gặp tư vấn viên</strong>
      <p>Nhân viên phòng khám sẽ trả lời ngay tại đây trong giờ làm việc. Bạn cũng nhận được thông báo khi có phản hồi.</p>
      <label htmlFor="support-message">Bạn cần hỗ trợ gì?</label>
      <textarea
        id="support-message"
        rows={4}
        maxLength={2000}
        value={draft.message}
        onChange={(event) => setDraft({ ...draft, message: event.target.value })}
        placeholder="Ví dụ: Tôi đã thanh toán nhưng lịch hẹn vẫn ở trạng thái chờ..."
      />
      {transcriptCount > 0 ? (
        <label className="patient-support-handoff__share">
          <input
            type="checkbox"
            checked={draft.share}
            onChange={(event) => setDraft({ ...draft, share: event.target.checked })}
          />
          Gửi kèm {transcriptCount} tin nhắn gần nhất với trợ lý AI để nhân viên không phải hỏi lại
        </label>
      ) : null}
      <div className="patient-support-handoff__actions">
        <button type="button" className="patient-support-btn patient-support-btn--ghost" onClick={onCancel}>
          Quay lại
        </button>
        <button type="submit" className="patient-support-btn" disabled={busy || !draft.message.trim()}>
          {busy ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </div>
    </form>
  );
}

function SupportThread({ ticket }) {
  return (
    <>
      <div className={`patient-support-status patient-support-status--${ticket.status.toLowerCase()}`}>
        <span className="material-symbols-outlined">
          {ticket.status === "CLOSED" ? "task_alt" : ticket.status === "ANSWERED" ? "mark_chat_read" : "schedule"}
        </span>
        {SUPPORT_STATUS_TEXT[ticket.status] ?? ticket.status}
      </div>
      {(ticket.messages ?? []).map((m) => (
        <div
          key={m.id}
          className={`patient-ai-message patient-ai-message--${m.senderRole === "STAFF" ? "assistant" : "user"}`}
        >
          {m.senderRole === "STAFF" ? <span className="patient-support-sender">{m.senderName}</span> : null}
          <p>{m.content}</p>
          <small className="patient-support-time">{formatTime(m.createdAt)}</small>
        </div>
      ))}
    </>
  );
}

export function PatientAiChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [streamStatus, setStreamStatus] = useState("");
  const restoredRef = useRef(false);

  // human handoff: "ai" chat, "handoff" form, or "staff" conversation
  const [mode, setMode] = useState("ai");
  const [ticket, setTicket] = useState(null);
  const [handoffDraft, setHandoffDraft] = useState({ message: "", share: true, reason: "PATIENT_REQUEST" });
  const [staffUnread, setStaffUnread] = useState(false);
  const ticketLoadedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, ticket, mode]);

  // restore the latest conversation (kept server-side) once, when the widget is first opened
  useEffect(() => {
    if (!isOpen || restoredRef.current || !isLoggedIn()) return;
    restoredRef.current = true;
    getLatestConversation()
      .then((response) => {
        const conversation = response?.data;
        if (!conversation?.messages?.length) return;
        setConversationId(conversation.conversationId);
        setMessages([
          GREETING,
          ...conversation.messages.map((m) =>
            m.role === "assistant" && m.response
              ? toAssistantItem(m.response, m.feedback)
              : { role: m.role, text: m.content }
          ),
        ]);
      })
      .catch(() => {});
  }, [isOpen]);

  // load the patient's open ticket once, when the widget is first opened
  useEffect(() => {
    if (!isOpen || ticketLoadedRef.current || !isLoggedIn()) return;
    ticketLoadedRef.current = true;
    getMyActiveSupportTicket()
      .then((response) => setTicket(response?.data ?? null))
      .catch(() => {});
  }, [isOpen]);

  const applyMessage = useCallback((incoming, status) => {
    setTicket((current) => {
      if (!current || current.id !== incoming.ticketId) return current;
      const known = (current.messages ?? []).some((m) => m.id === incoming.id);
      return {
        ...current,
        status: status ?? current.status,
        messages: known ? current.messages : [...(current.messages ?? []), incoming],
      };
    });
  }, []);

  // realtime staff replies; polling below covers a dropped socket
  useSupportSocket(
    (event) => {
      if (!ticket || event.ticketId !== ticket.id) return;
      if (event.type === "MESSAGE" && event.message) {
        applyMessage(event.message, event.status);
        if (event.message.senderRole === "STAFF" && !(isOpen && mode === "staff")) setStaffUnread(true);
      } else if (event.type === "CLOSED") {
        setTicket((current) => (current ? { ...current, status: "CLOSED" } : current));
      }
    },
    isOpenTicket(ticket)
  );

  useEffect(() => {
    if (!isOpen || mode !== "staff" || !isOpenTicket(ticket)) return undefined;
    const timer = setInterval(() => {
      getSupportTicket(ticket.id)
        .then((response) => response?.data && setTicket(response.data))
        .catch(() => {});
    }, SUPPORT_POLL_MS);
    return () => clearInterval(timer);
  }, [isOpen, mode, ticket?.id, ticket?.status]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (!isLoggedIn()) {
      setError("Vui lòng đăng nhập bằng tài khoản bệnh nhân để dùng trợ lý AI.");
      return;
    }

    // the server keeps the history; only the new message is sent
    const placeholder = { role: "assistant", text: "", streaming: true, local: true };
    setMessages((current) => [...current, { role: "user", text: trimmed }, placeholder]);
    setMessage("");
    setError("");
    setStreamStatus("");
    setIsLoading(true);

    const updateStreaming = (update) =>
      setMessages((current) => current.map((m) => (m.streaming ? update(m) : m)));
    let finished = false;

    try {
      await streamChatWithAssistant(conversationId, trimmed, (event) => {
        if (event.type === "status") {
          setStreamStatus(TOOL_LABELS[event.tool] ?? "Đang xử lý...");
        } else if (event.type === "delta") {
          setStreamStatus("");
          updateStreaming((m) => ({ ...m, text: m.text + event.text }));
        } else if (event.type === "done" && event.response) {
          finished = true;
          setConversationId(event.response.conversationId ?? null);
          // the final answer is authoritative (e.g. replaced by the safety guard)
          updateStreaming(() => toAssistantItem(event.response));
        } else if (event.type === "error") {
          setError(event.message || "Không thể kết nối trợ lý AI lúc này.");
        }
      });
      if (!finished) {
        setMessages((current) => current.filter((m) => !m.streaming));
        setError((current) => current || "Mất kết nối với trợ lý AI. Bạn thử gửi lại nhé.");
      }
    } catch (requestError) {
      setMessages((current) => current.filter((m) => !m.streaming));
      setError(requestError.message || "Không thể kết nối trợ lý AI lúc này.");
    } finally {
      setStreamStatus("");
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event?.preventDefault();
    if (mode === "staff") sendToStaff(message);
    else send(message);
  }

  function goToPayment(proposal, appointmentId) {
    setIsOpen(false);
    navigate(`/booking?doctorId=${proposal.doctorId}&appointmentId=${appointmentId}`);
  }

  /**
   * The patient's click is the confirmation. The appointment is created by the normal booking API
   * with the patient's own JWT (ownership checks + slot locking in Spring); the AI never books.
   */
  async function confirmBooking(item) {
    const proposal = item.bookingProposal;
    if (isLoading || item.bookedAppointmentId) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await createAppointment({
        scheduleId: proposal.scheduleId,
        reason: proposal.reason || null,
      });
      const appointment = response?.data ?? response;
      setMessages((current) => [
        ...current.map((m) => (m === item ? { ...m, bookedAppointmentId: appointment.id } : m)),
        {
          role: "assistant",
          text:
            `Đã giữ chỗ lịch khám với BS. ${proposal.doctorName} lúc ${proposal.startTime} ` +
            `ngày ${formatDate(proposal.workDate)} (mã lịch hẹn ${appointment.id}). ` +
            "Bạn có 10 phút để thanh toán, đang chuyển sang trang thanh toán...",
        },
      ]);
      setTimeout(() => goToPayment(proposal, appointment.id), 1200);
    } catch (bookingError) {
      const message = bookingError.message || "";
      const text = message.toLowerCase().includes("patient profile")
        ? "Bạn cần hoàn thiện hồ sơ bệnh nhân trước khi đặt lịch."
        : message.includes("vừa có người đặt") || message.toLowerCase().includes("not available")
          ? "Khung giờ này vừa có người khác đặt. Bạn hãy chọn khung giờ khác nhé."
          : `Không đặt được lịch: ${message}`;
      setMessages((current) => [...current, { role: "assistant", text, needsProfile: text.includes("hồ sơ") }]);
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    setConversationId(null); // the next message starts a new server-side conversation
    setMessages([GREETING]);
    setError("");
    setMode("ai");
  }

  const transcript = messages
    .filter((m) => !m.local && m.text)
    .slice(-TRANSCRIPT_LIMIT)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }));

  function openSupport(reason = "PATIENT_REQUEST") {
    setError("");
    if (!isLoggedIn()) {
      setError("Vui lòng đăng nhập bằng tài khoản bệnh nhân để gặp tư vấn viên.");
      return;
    }
    if (isOpenTicket(ticket)) {
      setMode("staff");
      setStaffUnread(false);
      return;
    }
    const lastQuestion = [...messages].reverse().find((m) => m.role === "user" && !m.local)?.text ?? "";
    setHandoffDraft({ message: lastQuestion, share: true, reason: reason || "PATIENT_REQUEST" });
    setMode("handoff");
  }

  async function submitHandoff(event) {
    event?.preventDefault();
    if (isLoading || !handoffDraft.message.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await createSupportTicket({
        message: handoffDraft.message.trim(),
        reason: handoffDraft.reason,
        transcript: handoffDraft.share && transcript.length > 0 ? transcript : null,
      });
      setTicket(response?.data ?? null);
      setMode("staff");
    } catch (requestError) {
      setError(requestError.message || "Không gửi được yêu cầu hỗ trợ.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendToStaff(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !isOpenTicket(ticket)) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await sendSupportMessage(ticket.id, trimmed);
      setMessage("");
      if (response?.data) applyMessage(response.data, "WAITING_STAFF");
    } catch (requestError) {
      setError(requestError.message || "Không gửi được tin nhắn.");
    } finally {
      setIsLoading(false);
    }
  }

  async function endSupport() {
    if (!ticket || isLoading) return;
    setIsLoading(true);
    try {
      const response = await closeSupportTicket(ticket.id);
      setTicket(response?.data ?? { ...ticket, status: "CLOSED" });
    } catch (requestError) {
      setError(requestError.message || "Không kết thúc được cuộc hỗ trợ.");
    } finally {
      setIsLoading(false);
    }
  }

  function backToAssistant() {
    setMode("ai");
    if (ticket?.status === "CLOSED") setTicket(null);
  }

  return (
    <div className="patient-ai-widget">
      {isOpen ? (
        <section className="patient-ai-panel" aria-label="Trợ lý AI đặt lịch khám">
          <div className="patient-ai-panel__head">
            <div>
              <span>{mode === "ai" ? "Trợ lý AI" : "Hỗ trợ trực tiếp"}</span>
              <strong>{mode === "ai" ? "Tư vấn & đặt lịch" : "Tư vấn viên phòng khám"}</strong>
            </div>
            <div className="patient-ai-panel__head-actions">
              {mode === "ai" ? (
                <>
                  <button
                    type="button"
                    className="patient-ai-icon-btn patient-ai-icon-btn--support"
                    onClick={() => openSupport()}
                    aria-label="Gặp tư vấn viên"
                    title="Gặp tư vấn viên"
                  >
                    <span className="material-symbols-outlined">support_agent</span>
                    {staffUnread || ticket?.status === "ANSWERED" ? <i className="patient-ai-dot" /> : null}
                  </button>
                  <button type="button" className="patient-ai-icon-btn" onClick={resetConversation} aria-label="Cuộc trò chuyện mới">
                    <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="patient-ai-icon-btn"
                  onClick={backToAssistant}
                  aria-label="Quay lại trợ lý AI"
                  title="Quay lại trợ lý AI"
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                </button>
              )}
              <button type="button" className="patient-ai-icon-btn" onClick={() => setIsOpen(false)} aria-label="Đóng trợ lý AI">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="patient-ai-panel__body">
            {mode === "handoff" ? (
              <HandoffForm
                draft={handoffDraft}
                setDraft={setHandoffDraft}
                transcriptCount={transcript.length}
                onSubmit={submitHandoff}
                onCancel={() => setMode("ai")}
                busy={isLoading}
              />
            ) : null}

            {mode === "staff" && ticket ? (
              <div className="patient-ai-messages" aria-live="polite">
                <SupportThread ticket={ticket} />
                <div ref={endRef} />
              </div>
            ) : null}

            {mode === "ai" ? (
            <div className="patient-ai-messages" aria-live="polite">
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`patient-ai-message patient-ai-message--${item.role}`}>
                  {item.emergency ? <EmergencyBanner emergency={item.emergency} /> : null}
                  {item.streaming && !item.text ? (
                    <p className="patient-ai-typing">{streamStatus || "Đang suy nghĩ..."}</p>
                  ) : (
                    <p>{item.text}</p>
                  )}
                  {item.streaming && item.text && streamStatus ? (
                    <small className="patient-ai-typing">{streamStatus}</small>
                  ) : null}
                  {item.needsProfile ? (
                    <Link to={`/profile?returnTo=${encodeURIComponent("/")}`} onClick={() => setIsOpen(false)}>
                      Cập nhật hồ sơ
                    </Link>
                  ) : null}
                  {item.role === "assistant" && !item.streaming ? (
                    <AssistantExtras
                      item={item}
                      onSend={send}
                      onConfirmBooking={confirmBooking}
                      onGoToPayment={goToPayment}
                      onHandoff={openSupport}
                      disabled={isLoading}
                    />
                  ) : null}
                </div>
              ))}
              {isLoading && !messages.some((m) => m.streaming) ? (
                <div className="patient-ai-message patient-ai-message--assistant">
                  <p>Đang xử lý...</p>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
            ) : null}

            {error ? (
              <p className="patient-ai-error">
                {error} {!isLoggedIn() ? <Link to="/login">Đăng nhập</Link> : null}
              </p>
            ) : null}

            {mode === "ai" && messages.length === 1 ? (
              <div className="patient-ai-prompts">
                {quickPrompts.map((prompt) => (
                  <button type="button" key={prompt} onClick={() => send(prompt)} disabled={isLoading}>
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {mode === "staff" && ticket ? (
              <div className="patient-support-footer">
                {isOpenTicket(ticket) ? (
                  <button
                    type="button"
                    className="patient-support-btn patient-support-btn--ghost"
                    onClick={endSupport}
                    disabled={isLoading}
                  >
                    Kết thúc hỗ trợ
                  </button>
                ) : (
                  <button type="button" className="patient-support-btn" onClick={backToAssistant}>
                    Quay lại trợ lý AI
                  </button>
                )}
              </div>
            ) : null}

            <p className="patient-ai-disclaimer">
              {mode === "ai"
                ? "Trợ lý không chẩn đoán hay kê đơn. Trường hợp khẩn cấp hãy gọi 115. Cuộc trò chuyện được lưu trong tài khoản để bạn xem lại và để phòng khám cải thiện trợ lý."
                : "Tư vấn viên hỗ trợ về lịch hẹn, thanh toán và tài khoản. Trường hợp khẩn cấp hãy gọi 115."}
            </p>
          </div>

          {mode === "ai" || (mode === "staff" && isOpenTicket(ticket)) ? (
            <form className="patient-ai-form" onSubmit={handleSubmit}>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={mode === "staff" ? "Nhắn cho tư vấn viên..." : "Mô tả triệu chứng hoặc đặt câu hỏi..."}
                aria-label="Nhập tin nhắn"
                maxLength={2000}
              />
              <button type="submit" disabled={isLoading || !message.trim()} aria-label="Gửi">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        className="patient-ai-fab"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Mở trợ lý AI"
      >
        <span className="material-symbols-outlined">smart_toy</span>
        <span>AI</span>
        {staffUnread ? <i className="patient-ai-dot" aria-label="Có phản hồi mới từ tư vấn viên" /> : null}
      </button>
    </div>
  );
}
