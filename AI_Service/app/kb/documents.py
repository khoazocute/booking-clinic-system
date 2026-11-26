"""Knowledge documents for RAG: one chunk per specialty, per active doctor, and per FAQ section."""

import hashlib
import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from app.retrieval.base import Specialty

FAQ_FILE = Path(__file__).resolve().parents[2] / "knowledge" / "faq.md"


@dataclass(frozen=True)
class KnowledgeDoc:
    id: str            # stable id, e.g. "doctor:3", "faq:chinh-sach-huy-lich-va-hoan-tien"
    source_type: str   # SPECIALTY | DOCTOR | FAQ
    source_id: int | None
    title: str
    content: str
    metadata: dict = field(default_factory=dict, compare=False, hash=False)

    @property
    def content_hash(self) -> str:
        """Changes when the text to embed changes -> only changed docs are re-embedded."""
        return hashlib.sha256(f"{self.title}\n{self.content}".encode()).hexdigest()

    @property
    def text_for_embedding(self) -> str:
        return f"{self.title}\n{self.content}"


def specialty_docs(specialties: list[Specialty]) -> list[KnowledgeDoc]:
    """Description + symptom profile, so RAG answers "which specialty for X" from the same
    vocabulary the triage router uses."""
    from app.kb.profiles import load_specialty_profiles, profile_for

    profiles = load_specialty_profiles()
    docs = []
    for s in specialties:
        symptoms = profile_for(s.name, profiles)
        content = (s.description or "") + (f" Triệu chứng thường gặp: {'; '.join(symptoms)}." if symptoms else "")
        docs.append(KnowledgeDoc(f"specialty:{s.id}", "SPECIALTY", s.id, f"Chuyên khoa {s.name}", content,
                                 {"specialtyId": s.id}))
    return docs


def is_bookable(d: dict, today: date) -> bool:
    """Mirrors AppointmentServiceImpl.validateDoctorForBooking. Used for both the knowledge base
    and the find_doctors tool, so RAG can never recommend a doctor the backend would refuse."""
    if str(d.get("status", "")).upper() != "ACTIVE":
        return False
    if str(d.get("licenseStatus") or "").upper() in {"EXPIRED", "SUSPENDED"}:
        return False
    expiry = d.get("licenseExpiryDate")
    return not (expiry and date.fromisoformat(str(expiry)[:10]) < today)


def doctor_docs(doctors: list[dict], today: date | None = None) -> list[KnowledgeDoc]:
    """Bookable doctors only, public profile fields only: no email, phone or license number."""
    today = today or date.today()
    docs = []
    for d in doctors:
        if not is_bookable(d, today):
            continue
        parts = [f"Bác sĩ {d.get('fullName')}, chuyên khoa {d.get('specialtyName') or 'chưa cập nhật'}."]
        if d.get("qualification"):
            parts.append(f"Trình độ: {d['qualification']}.")
        if d.get("experienceYears") is not None:
            parts.append(f"{d['experienceYears']} năm kinh nghiệm.")
        if d.get("clinicRoom"):
            parts.append(f"Phòng khám: {d['clinicRoom']}.")
        if d.get("consultationFee") is not None:
            parts.append(f"Phí khám: {d['consultationFee']}.")
        if d.get("averageRating") is not None:
            parts.append(f"Đánh giá trung bình: {d['averageRating']}/5.")
        if d.get("biography"):
            parts.append(f"Giới thiệu: {d['biography']}")
        docs.append(KnowledgeDoc(f"doctor:{d['id']}", "DOCTOR", int(d["id"]), f"Bác sĩ {d.get('fullName')}",
                                 " ".join(parts), {"doctorId": int(d["id"]), "specialtyId": d.get("specialtyId")}))
    return docs


def _slug(text: str) -> str:
    from app.text import normalize
    return normalize(text).replace(" ", "-")


def faq_docs(path: Path = FAQ_FILE) -> list[KnowledgeDoc]:
    text = re.sub(r"<!--.*?-->", "", path.read_text("utf-8"), flags=re.S)
    docs = []
    for section in re.split(r"^## ", text, flags=re.M)[1:]:
        title, _, body = section.partition("\n")
        title, body = title.strip(), " ".join(body.split())
        if body:
            docs.append(KnowledgeDoc(f"faq:{_slug(title)}", "FAQ", None, title, body))
    return docs


def all_knowledge_docs(specialties: list[Specialty], doctors: list[dict]) -> list[KnowledgeDoc]:
    """The whole knowledge base. Runtime, evals and tests all build it through this one function."""
    from app.kb.loaders import load_guide_docs

    return specialty_docs(specialties) + doctor_docs(doctors) + faq_docs() + load_guide_docs()
