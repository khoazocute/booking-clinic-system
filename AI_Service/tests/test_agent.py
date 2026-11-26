from datetime import datetime, timedelta

import pytest

from app.agent.agent import DOSAGE_BLOCKED, GIVE_UP, ClinicAgent
from app.agent.tools import VN, Artifacts, ClinicTools
from app.kb.documents import all_knowledge_docs
from app.kb.index import KnowledgeIndex
from app.kb.store import InMemoryVectorStore
from app.llm import AssistantTurn
from app.retrieval.keyword import KeywordRouter
from eval.fixtures import FixtureBackend
from tests.fakes import BagOfWordsEmbedder, ScriptedChatModel, call

backend = FixtureBackend()
TOMORROW = (backend.today + timedelta(days=1)).isoformat()


@pytest.fixture
def tools():
    index = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder())
    index.sync(all_knowledge_docs(backend.list_specialties(), backend.list_doctors()))
    noon_today = datetime.combine(backend.today, datetime.min.time(), VN).replace(hour=12)
    return ClinicTools(backend, index, KeywordRouter(backend.list_specialties()), clock=lambda: noon_today)


def user(text):
    return [{"role": "user", "content": text}]


# ---------- tools ----------

def test_find_doctors_hides_unbookable_doctors_and_contact_data(tools):
    result = tools.execute("find_doctors", '{"specialty_id": 4}', Artifacts())
    assert [d["id"] for d in result["doctors"]] == [7]  # doctor 9 has an expired license
    assert "email" not in result["doctors"][0] and "phone" not in result["doctors"][0]


def test_slots_exclude_booked_and_past(tools):
    slots = tools.execute("get_available_slots", '{"doctor_id": 2}', Artifacts())["slots"]
    assert all(s["workDate"] > backend.today.isoformat() for s in slots)
    assert not any(s["workDate"] == TOMORROW and s["startTime"] == "09:00" for s in slots)  # BOOKED


def test_propose_booking_validates_slot_against_backend(tools):
    artifacts = Artifacts()
    booked_slot = 2 * 1000 + 20 + 2
    assert "error" in tools.execute("propose_booking", f'{{"doctor_id": 2, "schedule_id": {booked_slot}}}', artifacts)
    assert artifacts.proposal is None

    free_slot = 2 * 1000 + 20 + 1
    result = tools.execute("propose_booking", f'{{"doctor_id": 2, "schedule_id": {free_slot}, "reason": "đau họng"}}',
                           artifacts)
    assert artifacts.proposal["scheduleId"] == free_slot and "NOT booked" in result["note"]


def test_tool_errors_are_returned_to_the_model_not_raised(tools):
    assert "error" in tools.execute("find_doctors", "{not json", Artifacts())
    assert "error" in tools.execute("drop_database", "{}", Artifacts())
    assert "error" in tools.execute("get_available_slots", '{"unexpected": 1}', Artifacts())


# ---------- agent loop ----------

def test_emergency_short_circuits_without_calling_the_model(tools):
    llm = ScriptedChatModel([])
    result = ClinicAgent(llm, tools).run(user("Bố tôi đột nhiên méo miệng, yếu nửa người"))
    assert result.emergency.category == "STROKE"
    assert llm.requests == []


def test_personal_data_is_redacted_before_reaching_the_model(tools):
    llm = ScriptedChatModel([AssistantTurn("Bạn nên khám Tai mũi họng.")])
    ClinicAgent(llm, tools).run(user("Tôi tên là Trần Văn Bình, sđt 0912345678, bị đau họng"))
    sent = llm.requests[0][-1]["content"]
    assert "0912345678" not in sent and "Bình" not in sent and "đau họng" in sent


def test_full_booking_flow_produces_a_proposal_not_a_booking(tools):
    free_slot = 2 * 1000 + 20 + 1
    llm = ScriptedChatModel([
        call("suggest_specialty", symptoms="đau họng, nghẹt mũi"),
        call("find_doctors", specialty_id=5),
        call("get_available_slots", doctor_id=2),
        call("propose_booking", doctor_id=2, schedule_id=free_slot, reason="đau họng"),
        AssistantTurn("Tôi đã chuẩn bị lịch với BS Trần Minh Khang, bạn bấm xác nhận để đặt."),
    ])
    result = ClinicAgent(llm, tools).run(user("Tôi đau họng, nghẹt mũi, muốn đặt lịch sớm nhất"))

    assert result.artifacts.tool_calls == ["suggest_specialty", "find_doctors", "get_available_slots", "propose_booking"]
    assert result.artifacts.proposal["doctorName"] == "Trần Minh Khang"
    tool_messages = [m for m in llm.requests[-1] if m["role"] == "tool"]
    assert len(tool_messages) == 4


def test_only_citations_that_were_retrieved_and_used_are_returned(tools):
    llm = ScriptedChatModel([
        call("search_clinic_knowledge", query="huỷ lịch hoàn tiền"),
        AssistantTurn("Huỷ trước 24 giờ được hoàn 100% [K1]. Xem thêm [K9]."),
    ])
    result = ClinicAgent(llm, tools).run(user("Huỷ lịch có được hoàn tiền không?"))
    assert result.cited == ["K1"]  # K9 was never retrieved: not a valid citation
    assert "hoan-tien" in result.artifacts.citations["K1"].id  # FAQ or the detailed refund guide


def test_output_guard_blocks_dosage_instructions(tools):
    llm = ScriptedChatModel([AssistantTurn("Bạn uống paracetamol 500 mg mỗi 6 giờ.")])
    result = ClinicAgent(llm, tools).run(user("Tôi sốt, uống thuốc gì?"))
    assert result.answer == DOSAGE_BLOCKED and result.output_blocked


def test_gives_up_after_max_tool_iterations(tools):
    llm = ScriptedChatModel([call("find_doctors", call_id=f"c{i}") for i in range(10)])
    result = ClinicAgent(llm, tools, max_iterations=3).run(user("tìm bác sĩ"))
    assert result.answer == GIVE_UP and len(llm.requests) == 3


# ---------- human handoff ----------

def test_handoff_tool_only_offers_a_button(tools):
    artifacts = Artifacts()
    result = tools.execute("offer_human_support", '{"reason": "PAYMENT_ISSUE"}', artifacts)
    assert artifacts.handoff_reason == "PAYMENT_ISSUE"
    assert "NOT been contacted" in result["note"]  # the model must not claim staff were contacted

    tools.execute("offer_human_support", '{"reason": "anything else"}', artifacts)
    assert artifacts.handoff_reason == "PATIENT_REQUEST"  # unknown reasons are normalized


def test_agent_suggests_handoff_when_the_model_offers_it(tools):
    llm = ScriptedChatModel([call("offer_human_support", reason="PATIENT_REQUEST"),
                             AssistantTurn("Bạn bấm nút Gặp tư vấn viên để nhân viên phản hồi nhé.")])
    result = ClinicAgent(llm, tools).run(user("Cho tôi nói chuyện với nhân viên"))
    assert result.handoff_suggested and result.artifacts.handoff_reason == "PATIENT_REQUEST"


def test_agent_suggests_handoff_when_it_gives_up_but_not_on_normal_answers(tools):
    gave_up = ClinicAgent(ScriptedChatModel([call("find_doctors", call_id=f"c{i}") for i in range(5)]), tools,
                          max_iterations=2).run(user("tìm bác sĩ"))
    assert gave_up.handoff_suggested

    normal = ClinicAgent(ScriptedChatModel([AssistantTurn("Phòng khám làm việc từ 7h30.")]), tools).run(user("Mấy giờ mở cửa?"))
    assert not normal.handoff_suggested

    emergency = ClinicAgent(ScriptedChatModel([]), tools).run(user("Tôi đau ngực dữ dội, khó thở"))
    assert emergency.emergency and not emergency.handoff_suggested  # 115 comes first, not a ticket
