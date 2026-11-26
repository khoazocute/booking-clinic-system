"""Triage pipeline: emergency check -> PII redaction -> specialty routing.

Order is deliberate:
1. Red flags are checked first, locally, on the raw message. Emergencies never wait on (or
   depend on) an external model.
2. Only the redacted text may leave the service (embedding / LLM API calls).
3. The router never writes anything; booking stays in the Spring backend behind user confirmation.
"""

from dataclasses import dataclass

from app.retrieval.base import Ranked, SpecialtyRouter
from app.retrieval.rules import prefer_pediatrics
from app.safety.pii import PiiSanitizer
from app.safety.red_flags import RedFlag, RedFlagDetector

DISCLAIMER = "Đây chỉ là gợi ý hỗ trợ đặt lịch, không thay thế chẩn đoán của bác sĩ."
REFUSAL = (
    "Tôi chưa xác định được chuyên khoa phù hợp từ mô tả của bạn. Bạn có thể mô tả rõ hơn triệu chứng "
    "(vị trí, thời gian, mức độ), hoặc đặt lịch khám tổng quát để bác sĩ tư vấn thêm."
)


@dataclass(frozen=True)
class TriageResult:
    emergency: RedFlag | None
    refused: bool
    answer: str
    suggestions: list[Ranked]
    pii_redacted: int


class TriagePipeline:
    def __init__(self, router: SpecialtyRouter, detector: RedFlagDetector | None = None,
                 sanitizer: PiiSanitizer | None = None, max_suggestions: int = 3):
        self.router = router
        self._detector = detector or RedFlagDetector()
        self._sanitizer = sanitizer or PiiSanitizer()
        self._max_suggestions = max_suggestions

    def run(self, message: str) -> TriageResult:
        flag = self._detector.detect(message)
        if flag:
            return TriageResult(emergency=flag, refused=True, answer=flag.message, suggestions=[], pii_redacted=0)

        clean = self._sanitizer.sanitize(message)
        routed = self.router.route(clean.text)
        if routed.refused:
            return TriageResult(None, True, REFUSAL, [], clean.redacted_count)

        top = prefer_pediatrics(message, routed.ranked)[: self._max_suggestions]
        answer = f"Dựa trên mô tả của bạn, chuyên khoa phù hợp nhất là {top[0].specialty.name}. {DISCLAIMER}"
        return TriageResult(None, False, answer, top, clean.redacted_count)
