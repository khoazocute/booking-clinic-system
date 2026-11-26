"""Redact personal identifiers from free text before it is sent to any external model API.

Structured patient fields (name, phone, address, ID/insurance numbers, wallet balance…) are
never put into prompts in the first place: the backend sends only the message. This module
covers what the patient may TYPE into the chat ("tôi tên Nguyễn Văn A, sđt 0912 345 678").
"""

import re
from dataclasses import dataclass

_NAME_TRIGGER = re.compile(r"(?i)\b(tôi tên là|tên tôi là|tôi tên|em tên là|tên em là|em tên|mình tên là|tên mình là|mình tên)\s+")
_NEXT_WORD = re.compile(r"\s*([^\W\d_]+)")

# Order matters: more specific identifiers first, generic long numbers last.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("EMAIL", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")),
    ("INSURANCE_NO", re.compile(r"(?i)\b[a-z]{2}\d{13}\b")),          # BHYT: 2 letters + 13 digits
    ("PHONE", re.compile(r"(?<![\d])(?:\+?84|0)(?:[\s.-]?\d){9}(?!\d)")),  # VN mobile/landline, with separators
    ("ID_NO", re.compile(r"(?<!\d)\d{12}(?!\d)")),                      # CCCD
    ("NUMBER", re.compile(r"(?<!\d)\d{9,}(?!\d)")),                     # CMND / any long identifier
]


@dataclass(frozen=True)
class SanitizedText:
    text: str
    redactions: dict[str, int]

    @property
    def redacted_count(self) -> int:
        return sum(self.redactions.values())


class PiiSanitizer:
    def sanitize(self, text: str) -> SanitizedText:
        counts: dict[str, int] = {}
        result = self._redact_names(text or "", counts)
        for label, pattern in _PATTERNS:
            result, n = pattern.subn(f"[{label}]", result)
            if n:
                counts[label] = counts.get(label, 0) + n
        return SanitizedText(result, counts)

    @staticmethod
    def _redact_names(text: str, counts: dict[str, int]) -> str:
        """Replace up to 4 capitalised words following "tôi tên là" & co."""
        out, pos = [], 0
        for trigger in _NAME_TRIGGER.finditer(text):
            if trigger.start() < pos:
                continue
            cursor, name_end = trigger.end(), None
            for _ in range(4):
                word = _NEXT_WORD.match(text, cursor)
                if not word or not word.group(1)[0].isupper():
                    break
                cursor = name_end = word.end()
            if name_end is not None:
                out.append(text[pos:trigger.end()])
                out.append("[NAME]")
                pos = name_end
                counts["NAME"] = counts.get("NAME", 0) + 1
        out.append(text[pos:])
        return "".join(out)
