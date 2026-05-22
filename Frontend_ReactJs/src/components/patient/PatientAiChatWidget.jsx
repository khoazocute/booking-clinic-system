import { useState } from "react";
import { Link } from "react-router-dom";
import { consultSpecialty } from "../../services/aiConsultationService";

const quickPrompts = [
  "Toi bi dau nguc, kho tho va tim dap nhanh",
  "Toi bi noi man do, ngua da va mun nhieu",
  "Toi bi dau dau, chong mat va mat ngu",
];

export function PatientAiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Xin chao, toi co the goi y chuyen khoa phu hop dua tren trieu chung cua ban.",
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
          text: data?.answer ?? "Toi chua tim thay goi y phu hop.",
          suggestions: topSuggestions,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message || "Khong the goi AI tu van luc nay.");
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
        <section className="patient-ai-panel" aria-label="AI tu van chuyen khoa">
          <div className="patient-ai-panel__head">
            <div>
              <span>AI ho tro</span>
              <strong>Tu van chuyen khoa</strong>
            </div>
            <button
              type="button"
              className="patient-ai-icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Dong AI chat"
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
                            <span>Chuyen khoa</span>
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
                  <p>Dang phan tich trieu chung...</p>
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
              placeholder="Nhap trieu chung cua ban..."
              aria-label="Nhap trieu chung"
            />
            <button type="submit" disabled={isLoading || !message.trim()} aria-label="Gui">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="patient-ai-fab"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Mo AI tu van"
      >
        <span className="material-symbols-outlined">smart_toy</span>
        <span>AI</span>
      </button>
    </div>
  );
}
