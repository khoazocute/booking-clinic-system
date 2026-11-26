"""Clinic business rules applied on top of any router's ranking."""

import re

from app.retrieval.base import Ranked
from app.text import normalize

PEDIATRICS = "nhi khoa"
ADULT_AGE = 16

_AGE_YEARS = re.compile(r"\b(\d{1,2}) tuoi\b")
_AGE_MONTHS_OR_WEEKS = re.compile(r"\b\d{1,2} (thang|tuan) tuoi\b")  # "3 tháng nay" is a duration, not an age
_CHILD_WORDS = re.compile(r"\b(tre so sinh|so sinh|tre em|tre nho|em be|be|con (toi|em|minh|trai|gai|nha toi))\b")


def is_child_patient(message: str) -> bool:
    """True when the message is about a child: an explicit age under 16, an age in months/weeks,
    or child words without an adult age ("con tôi 30 tuổi" is an adult)."""
    text = normalize(message)
    if _AGE_MONTHS_OR_WEEKS.search(text):
        return True
    ages = [int(m.group(1)) for m in _AGE_YEARS.finditer(text)]
    if ages:
        return min(ages) < ADULT_AGE
    return bool(_CHILD_WORDS.search(text))


def prefer_pediatrics(message: str, ranked: list[Ranked]) -> list[Ranked]:
    """Children are seen by Pediatrics whatever organ the symptom is about."""
    if not is_child_patient(message):
        return ranked
    pediatrics = [r for r in ranked if normalize(r.specialty.name) == PEDIATRICS]
    if not pediatrics:
        return ranked
    return pediatrics + [r for r in ranked if r is not pediatrics[0]]
