"""Tools the chat agent can call. All are read-only; ``propose_booking`` only validates and
returns a proposal that the patient must confirm in the UI (the backend does the booking), and
``offer_human_support`` only shows a "talk to staff" button (the patient creates the request)."""

import json
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.backend_client import BackendClient
from app.kb.documents import KnowledgeDoc, is_bookable
from app.kb.index import KnowledgeIndex
from app.retrieval.base import SpecialtyRouter

VN = ZoneInfo("Asia/Ho_Chi_Minh")
SLOT_LOOKAHEAD_DAYS = 14


def now_vn() -> datetime:
    return datetime.now(VN)


@dataclass
class Artifacts:
    """Structured results the UI renders next to the answer (not parsed from model text)."""

    citations: dict[str, KnowledgeDoc] = field(default_factory=dict)
    doctors: list[dict] = field(default_factory=list)
    slots: list[dict] = field(default_factory=list)
    proposal: dict | None = None
    handoff_reason: str | None = None
    tool_calls: list[str] = field(default_factory=list)


def _fn(name: str, description: str, properties: dict, required: list[str]) -> dict:
    return {"type": "function", "function": {
        "name": name, "description": description,
        "parameters": {"type": "object", "properties": properties, "required": required,
                       "additionalProperties": False}}}


TOOL_SCHEMAS = [
    _fn("search_clinic_knowledge",
        "Search the clinic knowledge base: booking/payment/cancellation/refund rules, accounts, after-visit "
        "steps, how to prepare for a visit, emergency warning signs (GUIDE/FAQ), doctor profiles, "
        "specialty descriptions. Returns passages with citation refs like K1.",
        {"query": {"type": "string", "description": "search query in Vietnamese"},
         "source_type": {"type": "string", "enum": ["FAQ", "GUIDE", "DOCTOR", "SPECIALTY"],
                         "description": "optional filter"}},
        ["query"]),
    _fn("suggest_specialty",
        "Suggest the most suitable specialties for the patient's symptoms (evaluated triage model).",
        {"symptoms": {"type": "string", "description": "the patient's symptoms, in their words"}},
        ["symptoms"]),
    _fn("find_doctors",
        "List doctors currently accepting appointments, optionally filtered by specialty id or name.",
        {"specialty_id": {"type": "integer"}, "name": {"type": "string"}},
        []),
    _fn("get_available_slots",
        "List free appointment slots of a doctor (next 14 days, or one date).",
        {"doctor_id": {"type": "integer"},
         "date": {"type": "string", "description": "YYYY-MM-DD, optional"}},
        ["doctor_id"]),
    _fn("propose_booking",
        "Prepare a booking proposal for a slot the patient explicitly chose. Does NOT book: the patient "
        "must press the confirm button.",
        {"doctor_id": {"type": "integer"}, "schedule_id": {"type": "integer"},
         "reason": {"type": "string", "description": "short reason for the visit, from the patient's own words"}},
        ["doctor_id", "schedule_id"]),
    _fn("offer_human_support",
        "Offer the patient a button to talk to clinic staff. Use when the patient asks for a real person, is "
        "unhappy or complaining, has a payment/refund problem with their own account, or needs something "
        "these tools cannot do. Does NOT contact anyone: the patient decides whether to press the button.",
        {"reason": {"type": "string", "enum": ["PATIENT_REQUEST", "COMPLAINT", "PAYMENT_ISSUE", "OUT_OF_SCOPE"]}},
        ["reason"]),
]

HANDOFF_REASONS = {"PATIENT_REQUEST", "COMPLAINT", "PAYMENT_ISSUE", "OUT_OF_SCOPE"}


def _public_doctor(d: dict) -> dict:
    """Only what a patient needs to choose a doctor; no email, phone or license number."""
    return {"id": d["id"], "fullName": d.get("fullName"), "specialtyId": d.get("specialtyId"),
            "specialtyName": d.get("specialtyName"), "experienceYears": d.get("experienceYears"),
            "qualification": d.get("qualification"), "averageRating": d.get("averageRating"),
            "consultationFee": d.get("consultationFee"), "clinicRoom": d.get("clinicRoom")}


class ClinicTools:
    def __init__(self, backend: BackendClient, knowledge: KnowledgeIndex | None,
                 triage_router: SpecialtyRouter, clock: Callable[[], datetime] = now_vn):
        self._backend = backend
        self._knowledge = knowledge
        self._triage = triage_router
        self._clock = clock

    schemas = TOOL_SCHEMAS

    @property
    def knowledge(self) -> KnowledgeIndex | None:
        return self._knowledge

    def execute(self, name: str, raw_arguments: str, artifacts: Artifacts) -> dict:
        artifacts.tool_calls.append(name)
        try:
            args = json.loads(raw_arguments or "{}")
            handler = getattr(self, f"_tool_{name}", None)
            if handler is None:
                return {"error": f"unknown tool {name}"}
            return handler(artifacts, **args)
        except TypeError as exc:
            return {"error": f"invalid arguments: {exc}"}
        except Exception as exc:  # backend down, bad JSON... the model gets the error and can apologise
            return {"error": f"{type(exc).__name__}: {exc}"}

    def _tool_search_clinic_knowledge(self, artifacts: Artifacts, query: str, source_type: str | None = None):
        if self._knowledge is None:
            return {"error": "knowledge base unavailable"}
        hits = self._knowledge.search(query, k=4, source_types=[source_type] if source_type else None)
        results = []
        for hit in hits:
            ref = next((r for r, d in artifacts.citations.items() if d.id == hit.doc.id), None)
            if ref is None:
                ref = f"K{len(artifacts.citations) + 1}"
                artifacts.citations[ref] = hit.doc
            results.append({"ref": ref, "title": hit.doc.title, "content": hit.doc.content})
        return {"results": results} if results else {"results": [], "note": "no relevant passage found"}

    def _tool_offer_human_support(self, artifacts: Artifacts, reason: str = "PATIENT_REQUEST"):
        artifacts.handoff_reason = reason if reason in HANDOFF_REASONS else "PATIENT_REQUEST"
        return {"status": "button_shown",
                "note": "The patient now sees a 'Gặp tư vấn viên' button. Staff have NOT been contacted yet: "
                        "tell the patient to press it if they want a staff member to reply."}

    def _tool_suggest_specialty(self, artifacts: Artifacts, symptoms: str):
        routed = self._triage.route(symptoms)
        if routed.refused:
            return {"specialties": [], "note": "no confident match; suggest a general check-up or ask for details"}
        return {"specialties": [{"specialtyId": r.specialty.id, "name": r.specialty.name, "score": round(r.score, 3)}
                                for r in routed.ranked[:3]]}

    def _tool_find_doctors(self, artifacts: Artifacts, specialty_id: int | None = None, name: str | None = None):
        today = self._clock().date()
        doctors = [_public_doctor(d) for d in self._backend.list_doctors(specialty_id, name) if is_bookable(d, today)]
        doctors.sort(key=lambda d: -(float(d["averageRating"] or 0)))
        artifacts.doctors = doctors[:5]
        return {"doctors": artifacts.doctors} if doctors else {"doctors": [], "note": "no doctor available"}

    def _free_slots(self, doctor_id: int, on_date: str | None) -> list[dict]:
        now = self._clock()
        today, current = now.date(), now.time().replace(tzinfo=None)
        last_day = today + timedelta(days=SLOT_LOOKAHEAD_DAYS)
        slots = []
        for s in self._backend.list_schedules(doctor_id, on_date):
            work_date = date.fromisoformat(str(s["workDate"])[:10])
            start = time.fromisoformat(str(s["startTime"])[:8])
            if str(s.get("status", "")).upper() != "AVAILABLE":
                continue
            if work_date < today or (work_date == today and start <= current) or work_date > last_day:
                continue  # mirrors the backend's "cannot book a slot in the past"
            slots.append({"scheduleId": s["id"], "doctorId": doctor_id, "workDate": work_date.isoformat(),
                          "startTime": str(s["startTime"])[:5], "endTime": str(s["endTime"])[:5]})
        return sorted(slots, key=lambda s: (s["workDate"], s["startTime"]))

    def _tool_get_available_slots(self, artifacts: Artifacts, doctor_id: int, date: str | None = None):
        slots = self._free_slots(doctor_id, date)[:8]
        artifacts.slots = slots
        return {"slots": slots} if slots else {"slots": [], "note": "no free slot in this period"}

    def _tool_propose_booking(self, artifacts: Artifacts, doctor_id: int, schedule_id: int, reason: str = ""):
        slot = next((s for s in self._free_slots(doctor_id, None) if s["scheduleId"] == schedule_id), None)
        if slot is None:
            return {"error": "this slot is not available for this doctor; ask the patient to pick another one"}
        doctor = next((d for d in self._backend.list_doctors() if d["id"] == doctor_id), None)
        if doctor is None or not is_bookable(doctor, self._clock().date()):
            return {"error": "doctor is not accepting appointments"}
        artifacts.proposal = {**slot, "doctorName": doctor.get("fullName"),
                              "specialtyName": doctor.get("specialtyName"),
                              "consultationFee": doctor.get("consultationFee"), "reason": (reason or "")[:300]}
        return {"proposal": artifacts.proposal,
                "note": "NOT booked yet. Tell the patient to press the confirm button to book and pay."}
