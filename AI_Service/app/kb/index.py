"""Knowledge index: incremental ingestion + hybrid (vector + BM25) retrieval with RRF,
optionally followed by a cross-encoder reranker over the top candidates."""

import logging
import threading
from dataclasses import dataclass

from app.kb.bm25 import BM25, reciprocal_rank_fusion
from app.kb.documents import KnowledgeDoc
from app.kb.rerank import Reranker
from app.kb.store import VectorStore
from app.retrieval.embedding import Embedder, embed_query

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncReport:
    total: int
    embedded: int
    deleted: int


@dataclass(frozen=True)
class SearchHit:
    doc: KnowledgeDoc
    score: float          # fused RRF score (used for ranking)
    vector_score: float   # cosine similarity (used for relevance thresholds)
    rerank_score: float | None = None  # cross-encoder score when a reranker is configured


class KnowledgeIndex:
    def __init__(self, store: VectorStore, embedder: Embedder, min_vector_score: float = 0.2,
                 reranker: Reranker | None = None, rerank_candidates: int = 20):
        self._store = store
        self._embedder = embedder
        self._min_vector_score = min_vector_score
        self._reranker = reranker
        self._rerank_candidates = rerank_candidates
        self._lock = threading.Lock()
        self._docs: list[KnowledgeDoc] = []
        self._bm25: BM25 | None = None

    def sync(self, docs: list[KnowledgeDoc]) -> SyncReport:
        """Embed only new/changed docs, delete docs that no longer exist, rebuild BM25."""
        existing = self._store.existing_hashes(self._embedder.model_id)
        changed = [d for d in docs if existing.get(d.id) != d.content_hash]
        if changed:
            vectors = self._embedder.embed([d.text_for_embedding for d in changed])
            self._store.upsert(changed, vectors, self._embedder.model_id)
        deleted = self._store.delete_except({d.id for d in docs})

        bm25 = BM25([d.text_for_embedding for d in docs])
        with self._lock:
            self._docs, self._bm25 = list(docs), bm25
        log.info("knowledge index synced: %d docs, %d embedded, %d deleted", len(docs), len(changed), deleted)
        return SyncReport(len(docs), len(changed), deleted)

    def search(self, query: str, k: int = 5, source_types: list[str] | None = None) -> list[SearchHit]:
        with self._lock:
            docs, bm25 = self._docs, self._bm25
        if not docs or bm25 is None:
            return []

        vector_hits = self._store.search(embed_query(self._embedder, query), k=20,
                                         model_id=self._embedder.model_id, source_types=source_types)
        position = {d.id: i for i, d in enumerate(docs)}
        vector_rank = [position[d.id] for d, _ in vector_hits if d.id in position]
        vector_score = {position[d.id]: s for d, s in vector_hits if d.id in position}

        lexical = bm25.scores(query)
        allowed = [i for i, d in enumerate(docs) if not source_types or d.source_type in source_types]
        lexical_rank = [i for i in sorted(allowed, key=lambda i: -lexical[i]) if lexical[i] > 0][:20]

        fused = reciprocal_rank_fusion([vector_rank, lexical_rank])
        ranked = sorted(fused, key=lambda i: -fused[i])
        hits = [SearchHit(docs[i], fused[i], vector_score.get(i, 0.0)) for i in ranked]
        # keep lexical matches; drop vector-only hits that are semantically weak (nearest neighbour noise)
        hits = [h for h in hits if h.vector_score >= self._min_vector_score or lexical[position[h.doc.id]] > 0]
        if self._reranker is not None:
            hits = self._rerank(query, hits[:max(k, self._rerank_candidates)])
        return hits[:k]

    def _rerank(self, query: str, candidates: list[SearchHit]) -> list[SearchHit]:
        try:
            scores = self._reranker.score(query, [h.doc.text_for_embedding for h in candidates])
        except Exception:  # the reranker is an enhancement: on failure keep the first-stage order
            log.exception("reranker failed, using hybrid order")
            return candidates
        rescored = [SearchHit(h.doc, h.score, h.vector_score, s) for h, s in zip(candidates, scores)]
        return sorted(rescored, key=lambda h: -h.rerank_score)  # stable: ties keep the hybrid order
