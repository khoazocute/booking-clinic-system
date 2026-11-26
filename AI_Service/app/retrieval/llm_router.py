"""Zero-shot LLM classification baseline: with only 10 classes, an LLM can read every
specialty description at once. The eval decides whether retrieval is still worth it."""

import json
import logging

from app.llm import ChatModel
from app.retrieval.base import Ranked, RoutingResult, Specialty

log = logging.getLogger(__name__)

PROMPT = """Bạn là điều phối viên của phòng khám. Dựa vào mô tả của bệnh nhân, chọn tối đa 3 chuyên khoa phù hợp nhất
từ danh sách dưới đây, sắp xếp từ phù hợp nhất. Nếu nội dung không phải là mô tả triệu chứng / vấn đề sức khoẻ
(ví dụ chào hỏi, hỏi giờ mở cửa, nhờ kê đơn thuốc, chủ đề khác), trả về danh sách rỗng.

Danh sách chuyên khoa:
{catalog}

Chỉ trả về JSON dạng {{"specialty_ids": [<id>, ...]}}."""


class LlmRouter:
    def __init__(self, model: ChatModel, specialties: list[Specialty]):
        self.name = f"llm[{model.model_id}]"
        self._model = model
        self._by_id = {s.id: s for s in specialties}
        catalog = "\n".join(f"- id={s.id}: {s.name}. {s.description}" for s in specialties)
        self._system = PROMPT.format(catalog=catalog)

    def rank(self, query: str) -> list[Ranked]:
        turn = self._model.complete([{"role": "system", "content": self._system},
                                     {"role": "user", "content": query}], json_mode=True)
        try:
            ids = json.loads(turn.content or "{}").get("specialty_ids", [])
        except (json.JSONDecodeError, AttributeError):
            log.warning("LLM router returned non-JSON: %r", turn.content)
            ids = []
        picked = [self._by_id[i] for i in ids if isinstance(i, int) and i in self._by_id][:3]
        # pseudo-scores keep the rank order visible in reports
        return [Ranked(s, 1.0 - 0.1 * n) for n, s in enumerate(picked)]

    def route(self, query: str) -> RoutingResult:
        ranked = self.rank(query)
        return RoutingResult(refused=not ranked, ranked=ranked)
