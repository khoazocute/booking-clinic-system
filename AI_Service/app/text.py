"""Vietnamese text helpers shared by safety rules and the keyword baseline."""

import re
import unicodedata

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def normalize(text: str | None) -> str:
    """Lower-case, strip diacritics, and collapse punctuation into single spaces.

    Mirrors ``FakeAiEmbeddingServiceImpl.normalize`` in the Java backend so the keyword
    baseline gives identical results in both languages.
    """
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d").replace("Đ", "D").lower()
    return _NON_ALNUM.sub(" ", stripped).strip()


def has_diacritics(text: str) -> bool:
    """True if the user typed Vietnamese tone/vowel marks (so accent-stripping would lose information)."""
    if "đ" in text or "Đ" in text:
        return True
    return any(unicodedata.category(ch) == "Mn" for ch in unicodedata.normalize("NFD", text))
