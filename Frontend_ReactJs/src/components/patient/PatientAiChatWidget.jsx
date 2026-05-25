import { useState } from "react";
import { Link } from "react-router-dom";
import { consultSpecialty } from "../../services/aiConsultationService";

const quickPrompts = [
  "Tôi bị đau ngực, khó thở và tim đập nhanh",
  "Tôi bị nổi mẩn đỏ, ngứa da và mụn nhiều",
  "Tôi bị đau đầu, chóng mặt và mất ngủ",
];

export function PatientAiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Xin chào, tôi có thể gợi ý chuyên khoa phù hợp dựa trên triệu chứng của bạn.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event?.preventDefault();
    const trimmed = message.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setMessage("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setIsLoading(true);

    try {
      const response = await consultSpecialty(trimmed);
      const data = response?.data;
      const suggestions = data?.suggestions ?? [];
      const topSuggestions = suggestions.slice(0, 3);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data?.answer ?? "Tôi chưa tìm thấy gợi ý phù hợp.",
          suggestions: topSuggestions,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message || "Không thể gọi AI tư vấn lúc này.");
    } finally {
      setIsLoading(false);
    }
  }

  function useQuickPrompt(prompt) {
    setMessage(prompt);
    setIsOpen(true);
  }

  return (
    <div className="patient-ai-widget">
      {isOpen ? (
        <section className="patient-ai-panel" aria-label="AI tư vấn chuyên khoa">
          <div className="patient-ai-panel__head">
            <div>
              <span>AI hỗ trợ</span>
              <strong>Tư vấn chuyên khoa</strong>
            </div>
            <button
              type="button"
              className="patient-ai-icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng AI chat"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="patient-ai-panel__body">
            <div className="patient-ai-messages">
              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`patient-ai-message patient-ai-message--${item.role}`}
                >
                  <p>{item.text}</p>
                  {item.suggestions?.length > 0 ? (
                    <div className="patient-ai-suggestions">
                      {item.suggestions.map((suggestion) => (
                        <div className="patient-ai-suggestion" key={`${suggestion.sourceType}-${suggestion.sourceId}`}>
                          <div>
                            <strong>{suggestion.title}</strong>
                            <span>Chuyên khoa</span>
                          </div>
                          <Link to={`/specialties/${suggestion.sourceId}`}>Xem</Link>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {isLoading ? (
                <div className="patient-ai-message patient-ai-message--assistant">
                  <p>Đang phân tích triệu chứng...</p>
                </div>
              ) : null}
            </div>

            {error ? <p className="patient-ai-error">{error}</p> : null}

            <div className="patient-ai-prompts">
              {quickPrompts.map((prompt) => (
                <button type="button" key={prompt} onClick={() => useQuickPrompt(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form className="patient-ai-form" onSubmit={handleSubmit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập triệu chứng của bạn..."
              aria-label="Nhập triệu chứng"
            />
            <button type="submit" disabled={isLoading || !message.trim()} aria-label="Gửi">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="patient-ai-fab"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Mở AI tư vấn"
      >
        <span className="material-symbols-outlined">smart_toy</span>
        <span>AI</span>
      </button>
    </div>
  );
}
