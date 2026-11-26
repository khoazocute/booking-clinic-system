"""Lexical (BM25) and hybrid (BM25 + embeddings, fused with RRF) specialty routers."""

import numpy as np

from app.kb.bm25 import BM25, reciprocal_rank_fusion
from app.kb.profiles import Profiles, profile_for
from app.retrieval.base import Ranked, RoutingResult, Specialty
from app.retrieval.embedding import Embedder, EmbeddingRouter, specialty_document


class BM25Router:
    """Offline lexical baseline: a proper ranking function instead of hand-written keyword lists.
    With profiles, each specialty document is its description plus its symptom profile."""

    def __init__(self, specialties: list[Specialty], refusal_threshold: float = 0.0,
                 profiles: Profiles | None = None):
        self.name = "bm25" + ("+profiles" if profiles else "")
        self._specialties = list(specialties)
        self._bm25 = BM25([" ".join([specialty_document(s), *profile_for(s.name, profiles)]) for s in specialties])
        self.refusal_threshold = refusal_threshold

    def rank(self, query: str) -> list[Ranked]:
        scores = self._bm25.scores(query)
        order = np.argsort(-scores, kind="stable")
        return [Ranked(self._specialties[i], float(scores[i])) for i in order]

    def route(self, query: str) -> RoutingResult:
        ranked = self.rank(query)
        refused = ranked[0].score <= 0 or ranked[0].score < self.refusal_threshold
        return RoutingResult(refused, ranked[:5])


class HybridRouter:
    """Ranks by reciprocal-rank fusion of embedding and BM25 rankings.

    Scores reported (and thresholded for refusal) are cosine similarities, because RRF scores
    are rank-based and carry no notion of "how relevant".
    """

    def __init__(self, embedder: Embedder, specialties: list[Specialty], refusal_threshold: float,
                 profiles: Profiles | None = None):
        self.name = f"hybrid[{embedder.model_id}+bm25]" + ("+profiles" if profiles else "")
        self._dense = EmbeddingRouter(embedder, specialties, 0.0, profiles)
        self._lexical = BM25Router(specialties, profiles=profiles)
        self._index = {s.id: i for i, s in enumerate(specialties)}
        self._specialties = list(specialties)
        self.refusal_threshold = refusal_threshold

    def rank(self, query: str) -> list[Ranked]:
        dense = self._dense.rank(query)
        lexical = [r for r in self._lexical.rank(query) if r.score > 0]
        fused = reciprocal_rank_fusion([[self._index[r.specialty.id] for r in dense],
                                        [self._index[r.specialty.id] for r in lexical]])
        cosine = {r.specialty.id: r.score for r in dense}
        order = sorted(fused, key=lambda i: -fused[i])
        return [Ranked(self._specialties[i], cosine[self._specialties[i].id]) for i in order]

    def route(self, query: str) -> RoutingResult:
        ranked = self.rank(query)
        best_cosine = max(r.score for r in ranked)
        return RoutingResult(best_cosine < self.refusal_threshold, ranked[:5])
