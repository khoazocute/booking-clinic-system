"""Small Okapi BM25 for Vietnamese.

Tokens are accent-stripped syllables plus syllable bigrams: Vietnamese words are often two
syllables ("dạ dày", "khó thở"), and patients type with or without diacritics.
"""

import math
from collections import Counter

import numpy as np

from app.text import normalize

# Function words only. Accent stripping makes many short syllables ambiguous, so anything that
# can also be clinical is kept: "ma" (má/cheek), "rat" (rát/burning), "cung" (cứng/stiff),
# "de" (đè/pressing), "ban" (phát ban/rash), "em" (em bé), "co" (cổ/cơ), "khi" (khí hư), "bi" (tê bì).
STOPWORDS = frozenset("toi va cua cho nhung cac thi duoc dang se voi nay nhu gi nao minh oi nhe roi vay la khong".split())


def tokenize(text: str) -> list[str]:
    syllables = [t for t in normalize(text).split() if t not in STOPWORDS]
    return syllables + [f"{a}_{b}" for a, b in zip(syllables, syllables[1:])]


class BM25:
    def __init__(self, documents: list[str], k1: float = 1.5, b: float = 0.75):
        self._docs = [Counter(tokenize(d)) for d in documents]
        self._lengths = np.array([sum(c.values()) for c in self._docs], dtype=float)
        self._avg_len = float(self._lengths.mean()) if len(self._docs) else 0.0
        self._k1, self._b = k1, b
        df: Counter = Counter()
        for counts in self._docs:
            df.update(counts.keys())
        n = len(self._docs)
        self._idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def scores(self, query: str) -> np.ndarray:
        result = np.zeros(len(self._docs))
        for term in set(tokenize(query)):
            idf = self._idf.get(term)
            if idf is None:
                continue
            for i, counts in enumerate(self._docs):
                tf = counts.get(term, 0)
                if tf:
                    norm = self._k1 * (1 - self._b + self._b * self._lengths[i] / (self._avg_len or 1))
                    result[i] += idf * tf * (self._k1 + 1) / (tf + norm)
        return result


def reciprocal_rank_fusion(rankings: list[list[int]], k: int = 60) -> dict[int, float]:
    """Fuse several rankings (lists of item indices, best first). Score-scale free, so it can
    combine cosine similarities and BM25 scores without calibration."""
    fused: dict[int, float] = {}
    for ranking in rankings:
        for rank, item in enumerate(ranking):
            fused[item] = fused.get(item, 0.0) + 1.0 / (k + rank + 1)
    return fused
