"""Python port of the Java keyword router (``FakeAiEmbeddingServiceImpl`` +
``AiConsultationServiceImpl``), kept as the baseline every new method is compared against.

``tests/test_keyword_parity.py`` pins its eval numbers to the Java ones so the two
implementations cannot silently drift apart.
"""

import math

from app.retrieval.base import Ranked, RoutingResult, Specialty
from app.text import normalize

CATEGORY_KEYWORDS: list[list[str]] = [
    ["tim", "dau nguc", "kho tho", "huyet ap", "hoi hop", "roi loan nhip"],
    ["da", "mun", "ngua", "noi man", "viem da", "di ung da", "phat ban", "nam da"],
    ["tai", "mui", "hong", "ho", "dau hong", "nghet mui", "so mui", "u tai", "dau tai", "viem xoang"],
    ["dau dau", "chong mat", "co giat", "mat ngu", "te tay", "te chan", "dau nua dau"],
    ["tre em", "em be", "be", "nhi", "tre so sinh", "bieng an"],
    ["ho keo dai", "kho tho", "dau tuc nguc", "viem phoi", "hen suyen", "viem phe quan"],
    ["dau bung", "buon non", "non oi", "oi", "tieu chay", "tao bon", "dau da day", "trao nguoc", "roi loan tieu hoa"],
    ["dau lung", "dau vai gay", "dau khop", "te bi", "viem khop", "thoai hoa khop", "chan thuong"],
    ["phu khoa", "san khoa", "roi loan kinh nguyet", "dau bung kinh", "khi hu", "mang thai", "thai ky", "kham thai"],
    ["ung thu", "u buou", "khoi u", "sut can", "hach", "tam soat ung thu", "dau keo dai"],
]


def _build_index() -> list[tuple[str, list[int]]]:
    index: dict[str, list[int]] = {}
    for category, keywords in enumerate(CATEGORY_KEYWORDS):
        for keyword in keywords:
            index.setdefault(keyword, []).append(category)
    # stable sort, longest first: same order as the Java implementation
    return sorted(index.items(), key=lambda kv: len(kv[0]), reverse=True)


_KEYWORDS_LONGEST_FIRST = _build_index()


def keyword_vector(text: str) -> list[float]:
    remaining = f" {normalize(text)} "
    vector = [0.0] * (len(CATEGORY_KEYWORDS) + 1)
    for keyword, categories in _KEYWORDS_LONGEST_FIRST:
        needle = f" {keyword} "
        if needle not in remaining:
            continue
        remaining = remaining.replace(needle, " | ")
        for category in categories:
            vector[category] += 1.0
    vector[-1] = 1.0  # general bias
    return vector


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(y * y for y in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)


class KeywordRouter:
    name = "keyword"

    def __init__(self, specialties: list[Specialty]):
        # same document text as AiKnowledgeServiceImpl
        self._docs = [(s, keyword_vector(f"Chuyen khoa {s.name}. Mo ta: {s.description}")) for s in specialties]

    def rank(self, query: str) -> list[Ranked]:
        q = keyword_vector(query)
        ranked = [Ranked(s, _cosine(q, v)) for s, v in self._docs]
        return sorted(ranked, key=lambda r: r.score, reverse=True)  # stable, like Java's sort

    def route(self, query: str) -> RoutingResult:
        q = keyword_vector(query)
        has_clinical_signal = any(x > 0 for x in q[:-1])
        if not has_clinical_signal:
            return RoutingResult(refused=True, ranked=[])
        ranked = self.rank(query)[:5]
        return RoutingResult(refused=ranked[0].score <= 0, ranked=ranked)
