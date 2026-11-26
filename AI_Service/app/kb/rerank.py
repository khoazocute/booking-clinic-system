"""Second-stage reranking: a cross-encoder reads (query, passage) together and scores relevance.

First-stage retrieval (BM25 + vectors) encodes the query and each passage separately, so it is fast
but coarse. A cross-encoder attends across both texts, which is slower (one model pass per pair), so it
only re-scores the top candidates of the first stage.

Optional at runtime: set RERANKER_MODEL and install sentence-transformers (requirements-ml.txt).
"""

import logging
from typing import Protocol

log = logging.getLogger(__name__)


class Reranker(Protocol):
    model_id: str

    def score(self, query: str, passages: list[str]) -> list[float]:
        """One relevance score per passage, higher is more relevant."""
        ...


class CrossEncoderReranker:
    """sentence-transformers CrossEncoder, run locally on CPU (free, no API call)."""

    def __init__(self, model_name: str, max_length: int = 512):
        from sentence_transformers import CrossEncoder

        self._model = CrossEncoder(model_name, max_length=max_length, device="cpu")
        self.model_id = f"ce/{model_name}"

    def score(self, query: str, passages: list[str]) -> list[float]:
        if not passages:
            return []
        return [float(s) for s in self._model.predict([(query, p) for p in passages], batch_size=16)]


def load_reranker(model_name: str) -> Reranker | None:
    """Build the configured reranker, or None (feature off / dependency missing): retrieval still works."""
    if not model_name:
        return None
    try:
        reranker = CrossEncoderReranker(model_name)
    except Exception as exc:  # ImportError, download failure, out of memory...
        log.warning("reranker %s disabled: %s", model_name, exc)
        return None
    log.info("reranker enabled: %s", reranker.model_id)
    return reranker
