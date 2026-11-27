"""Streaming chat and staff agent-assist. All offline: scripted / fake models, no API calls."""

import json
from types import SimpleNamespace as NS

from fastapi.testclient import TestClient

from app.agent.agent import DOSAGE_BLOCKED, ClinicAgent, SentenceGate
from app.agent.assist import StaffAssistant
from app.agent.tools import ClinicTools
from app.config import Settings
from app.kb.documents import all_knowledge_docs
from app.kb.index import KnowledgeIndex
from app.kb.store import InMemoryVectorStore
from app.llm import AssistantTurn, OpenAIChatModel
from app.main import create_app
from app.retrieval.keyword import KeywordRouter
from eval.fixtures import FixtureBackend
from tests.fakes import BagOfWordsEmbedder, ScriptedChatModel, call

backend = FixtureBackend()
TOKEN = {"X-Internal-Token": "secret"}


class StreamingFake(ScriptedChatModel):
    """Streams each scripted text turn in small chunks, like the real API."""

    def stream(self, messages, tools=None):
        turn = self.complete(messages, tools)
        text = turn.content or ""
        for i in range(0, len(text), 7):
            yield "delta", text[i:i + 7]
        yield "turn", turn


def knowledge():
    index = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder())
    index.sync(all_knowledge_docs(backend.list_specialties(), backend.list_doctors()))
    return index


def user(text):
    return [{"role": "user", "content": text}]


# ---------- sentence gate (the streaming output guard) ----------

def test_gate_releases_whole_sentences_only_and_keeps_numbers_intact():
    gate = SentenceGate()
    assert gate.feed("Phí khám là 300.000 đ") == []          # "300.000" is not a sentence end
    assert gate.feed("ồng. Bạn có") == ["Phí khám là 300.000 đồng."]
    assert gate.flush() == [" Bạn có"]


def test_gate_never_releases_a_dosage_even_when_split_across_chunks():
    gate = SentenceGate()
    released = gate.feed("Bạn nên đi khám. ") + gate.feed("Uống 500 ") + gate.feed("mg mỗi ngày. Rồi")
    released += gate.flush()
    assert "".join(released) == "Bạn nên đi khám."
    assert gate.blocked


# ---------- streaming agent ----------

def test_stream_reports_tool_status_then_text_that_matches_the_final_answer():
    answer = "Bạn nên khám chuyên khoa Tai mũi họng. Tôi có thể tìm bác sĩ cho bạn."
    llm = StreamingFake([call("suggest_specialty", symptoms="đau họng"), AssistantTurn(answer)])
    tools = ClinicTools(backend, None, KeywordRouter(backend.list_specialties()))

    events = list(ClinicAgent(llm, tools).run_events(user("Tôi bị đau họng")))

    kinds = [e["type"] for e in events]
    assert kinds[0] == "status" and events[0]["tool"] == "suggest_specialty"
    assert kinds[-1] == "result" and set(kinds[1:-1]) == {"delta"}
    assert "".join(e["text"] for e in events if e["type"] == "delta") == answer
    assert events[-1]["result"].answer == answer


def test_streamed_dosage_is_cut_off_and_the_final_answer_replaced():
    llm = StreamingFake([AssistantTurn("Bạn bị sốt. Hãy uống paracetamol 500 mg mỗi 6 giờ.")])
    tools = ClinicTools(backend, None, KeywordRouter(backend.list_specialties()))

    events = list(ClinicAgent(llm, tools).run_events(user("Tôi sốt, uống thuốc gì?")))

    streamed = "".join(e["text"] for e in events if e["type"] == "delta")
    assert "500" not in streamed
    assert events[-1]["result"].answer == DOSAGE_BLOCKED and events[-1]["result"].output_blocked


def test_openai_stream_reassembles_tool_calls_sent_in_fragments():
    def chunk(content=None, tool_calls=None, usage=None):
        choices = [] if usage else [NS(delta=NS(content=content, tool_calls=tool_calls))]
        return NS(choices=choices, usage=usage)

    def fragment(index, id=None, name=None, args=None):
        return NS(index=index, id=id, function=NS(name=name, arguments=args))

    chunks = [chunk(tool_calls=[fragment(0, "call_1", "find_doctors", '{"spec')]),
              chunk(tool_calls=[fragment(0, args='ialty_id": 5}')]),
              chunk(tool_calls=[fragment(1, "call_2", "search_clinic_knowledge", '{"query": "hoàn tiền"}')]),
              chunk(usage=NS(prompt_tokens=120, completion_tokens=30))]
    model = OpenAIChatModel.__new__(OpenAIChatModel)
    model._client = NS(chat=NS(completions=NS(create=lambda **kwargs: iter(chunks))))
    model._model, model._models, model._temperature, model.model_id = "fake", ("fake",), None, "openai/fake"

    turn = list(model.stream([{"role": "user", "content": "x"}]))[-1][1]

    assert [(c.id, c.name, json.loads(c.arguments)) for c in turn.tool_calls] == [
        ("call_1", "find_doctors", {"specialty_id": 5}),
        ("call_2", "search_clinic_knowledge", {"query": "hoàn tiền"})]
    assert (turn.prompt_tokens, turn.completion_tokens) == (120, 30)


def test_stream_endpoint_sends_server_sent_events_ending_with_the_full_result():
    def agent_factory(settings, backend_, specialties, doctors, router):
        return ClinicAgent(StreamingFake([AssistantTurn("Phòng khám làm việc từ 7 giờ 30. Chủ nhật nghỉ.")]),
                           ClinicTools(backend_, None, router))

    app = create_app(Settings(internal_token="secret", _env_file=None), backend=FixtureBackend(),
                     router_factory=lambda s, sp: KeywordRouter(sp), agent_factory=agent_factory)
    response = TestClient(app).post("/v1/chat/stream", headers=TOKEN,
                                    json={"messages": [{"role": "user", "content": "Mấy giờ mở cửa?"}]})

    assert response.headers["content-type"].startswith("text/event-stream")
    events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
    assert events[-1]["type"] == "done"
    assert events[-1]["result"]["answer"].startswith("Phòng khám làm việc")
    assert {"handoffSuggested", "outputBlocked", "promptTokens"} <= set(events[-1]["result"])


# ---------- staff agent assist ----------

def draft(summary, reply):
    return AssistantTurn(json.dumps({"summary": summary, "reply": reply}, ensure_ascii=False))


def test_assist_drafts_a_grounded_reply_and_never_shows_pii_to_the_model():
    llm = ScriptedChatModel([draft("- Bệnh nhân huỷ lịch, hỏi mức hoàn tiền",
                                   "Theo quy định, huỷ trước 24 giờ được hoàn 100% [K1]. [kiểm tra lịch hẹn]")])
    result = StaffAssistant(llm, knowledge()).run(
        [{"role": "patient", "content": "Tôi tên là Nguyễn Văn An, sđt 0912345678, huỷ lịch có được hoàn tiền không?"}],
        ai_transcript="Bệnh nhân: email an@example.com", reason="PAYMENT_ISSUE")

    prompt = llm.requests[0][1]["content"]
    assert "0912345678" not in prompt and "Nguyễn Văn An" not in prompt and "an@example.com" not in prompt
    assert result.pii_redacted >= 3
    assert "QUY ĐỊNH LIÊN QUAN:\n[K1]" in prompt               # retrieved policy is in the context
    assert [ref for ref, _ in result.sources] == ["K1"]       # only the cited passage is returned
    assert result.reply.startswith("Theo quy định")


def test_assist_drops_a_draft_with_dosage_and_ignores_invented_citations():
    llm = ScriptedChatModel([draft("- Hỏi thuốc [K9]", "Bạn uống 2 viên mỗi ngày nhé.")])
    result = StaffAssistant(llm, knowledge()).run([{"role": "patient", "content": "Tôi uống thuốc gì?"}])
    assert result.reply == "" and result.output_blocked
    assert result.sources == []


def test_assist_endpoint_requires_a_chat_model():
    app = create_app(Settings(internal_token="secret", _env_file=None), backend=FixtureBackend(),
                     router_factory=lambda s, sp: KeywordRouter(sp), agent_factory=lambda *a: None)
    response = TestClient(app).post("/v1/support/assist", headers=TOKEN,
                                    json={"messages": [{"role": "patient", "content": "cần hỗ trợ"}]})
    assert response.status_code == 503
