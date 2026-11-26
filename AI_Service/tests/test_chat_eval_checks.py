"""The chat eval's deterministic checks must themselves be correct, otherwise the reported
pass rate means nothing."""

from datetime import timedelta

from app.agent.agent import ChatResult
from app.agent.tools import Artifacts
from eval.chat_eval import run_checks
from eval.fixtures import FixtureBackend

backend = FixtureBackend()
TOMORROW = (backend.today + timedelta(days=1)).isoformat()


def result(answer, **artifacts):
    return ChatResult(answer=answer, artifacts=Artifacts(**artifacts))


def test_contains_and_not_contains_ignore_accents_and_case():
    checks = {"contains_any": ["10 phút"], "not_contains": ["đã đặt thành công"]}
    assert run_checks(checks, result("Bạn có 10 PHUT để thanh toán."), backend) == []
    assert run_checks(checks, result("Lịch đã đặt thành công!"), backend) == [
        "missing any of ['10 phút']", "must not contain 'đã đặt thành công'"]


def test_proposal_check_compares_doctor_time_and_relative_date():
    checks = {"proposal": {"doctorId": 2, "startTime": "08:00", "workDateOffset": 1}}
    good = {"doctorId": 2, "startTime": "08:00", "workDate": TOMORROW}
    assert run_checks(checks, result("ok", proposal=good), backend) == []
    assert run_checks(checks, result("ok", proposal={**good, "startTime": "14:00"}), backend)
    assert run_checks(checks, result("ok"), backend)


def test_dosage_and_tool_checks():
    assert run_checks({"no_dosage": True}, result("Uống 500mg"), backend) == ["dosage in answer"]
    assert run_checks({"no_tools": True}, result("Xin lỗi", tool_calls=["find_doctors"]), backend)
    assert run_checks({"tools_any": ["suggest_specialty"]}, result("x", tool_calls=["suggest_specialty"]), backend) == []


def test_handoff_checks():
    offered = result("Bạn bấm nút Gặp tư vấn viên nhé.", handoff_reason="PATIENT_REQUEST")
    plain = result("Phòng khám mở cửa lúc 7h30.")
    assert run_checks({"handoff": True}, offered, backend) == []
    assert run_checks({"handoff": True}, plain, backend) == ["expected a 'talk to staff' offer"]
    assert run_checks({"no_handoff": True}, offered, backend) == ["unexpected 'talk to staff' offer"]
