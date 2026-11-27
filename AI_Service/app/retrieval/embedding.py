"""Dense-embedding specialty router.

The embedder is pluggable (OpenAI now; local sentence-transformers models such as bge-m3 or
multilingual-e5 for the model-comparison notebook), and every embedder is scored by the same
eval harness.
"""

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Protocol

import numpy as np

from app.kb.profiles import Profiles, profile_for
from app.retrieval.base import Ranked, RoutingResult, Specialty

log = logging.getLogger(__name__)


class Embedder(Protocol):
    """``embed`` is for documents. Asymmetric models (E5: "query:" vs "passage:") may also define
    ``embed_query``; use :func:`embed_query` to call it with a fallback to ``embed``."""

    model_id: str

    def embed(self, texts: list[str]) -> list[list[float]]: ...


def embed_query(embedder: Embedder, text: str) -> list[float]:
    query_fn = getattr(embedder, "embed_query", None)
    return query_fn(text) if query_fn else embedder.embed([text])[0]


def _unit(vector: list[float]) -> list[float]:
    """L2-normalise: truncated (Matryoshka) embeddings are not unit length, and dot products assume they are."""
    norm = sum(x * x for x in vector) ** 0.5
    return [x / norm for x in vector] if norm else vector


class OpenAIEmbedder:
    """OpenAI-compatible embeddings (OpenAI, or Gemini through its OpenAI-compatible endpoint)."""

    def __init__(self, api_key: str, model: str = "text-embedding-3-small", batch_size: int = 64,
                 base_url: str | None = None, provider: str = "openai", dimensions: int | None = None,
                 patient: bool = False, rate_limit_wait: float = 20.0):
        from openai import OpenAI  # imported lazily so tests and the keyword mode need no API key

        self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=30.0, max_retries=2)
        self._model = model
        self._batch_size = batch_size
        self._dimensions = dimensions
        # patient: wait out per-minute rate limits (indexing, evals). The request path stays impatient and
        # lets the caller fall back (KnowledgeIndex answers with BM25 alone) instead of making a patient wait.
        self._patient = patient
        self._rate_limit_wait = rate_limit_wait
        # the model id is stored with every vector: a different model or size re-embeds everything
        self.model_id = f"{provider}/{model}" + (f"@{dimensions}" if dimensions else "")

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), self._batch_size):
            batch = texts[start:start + self._batch_size]
            vectors.extend(self._create(batch, patient=True))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self._create([text], patient=self._patient)[0]

    def _create(self, batch: list[str], patient: bool) -> list[list[float]]:
        import openai

        kwargs = {"model": self._model, "input": batch}
        if self._dimensions:
            kwargs["dimensions"] = self._dimensions
        for attempt in range(4):
            try:
                response = self._client.embeddings.create(**kwargs)
                break
            except openai.RateLimitError:
                if not patient or attempt == 3:
                    raise
                time.sleep(self._rate_limit_wait)
        data = list(response.data)
        if all(getattr(d, "index", None) is not None for d in data):  # Gemini omits it; order is preserved
            data.sort(key=lambda d: d.index)
        return [_unit(item.embedding) for item in data]


class CachedEmbedder:
    """Disk cache keyed by (model, text). Makes repeated eval runs free and reproducible."""

    def __init__(self, inner: Embedder, cache_file: Path):
        self._inner = inner
        self._file = cache_file
        self.model_id = inner.model_id
        self._cache: dict[str, list[float]] = json.loads(cache_file.read_text("utf-8")) if cache_file.exists() else {}

    def _key(self, text: str) -> str:
        return hashlib.sha256(f"{self.model_id}\n{text}".encode()).hexdigest()

    def embed(self, texts: list[str]) -> list[list[float]]:
        missing = list(dict.fromkeys(t for t in texts if self._key(t) not in self._cache))
        if missing:
            log.info("embedding %d new texts with %s", len(missing), self.model_id)
            for text, vector in zip(missing, self._inner.embed(missing)):
                self._cache[self._key(text)] = vector
            self._save()
        return [self._cache[self._key(t)] for t in texts]

    def embed_query(self, text: str) -> list[float]:
        key = self._key(f"<query>\n{text}")
        if key not in self._cache:
            self._cache[key] = embed_query(self._inner, text)
            self._save()
        return self._cache[key]

    def _save(self) -> None:
        self._file.parent.mkdir(parents=True, exist_ok=True)
        self._file.write_text(json.dumps(self._cache), "utf-8")


def specialty_document(specialty: Specialty) -> str:
    return f"Chuyên khoa {specialty.name}. {specialty.description}"


def specialty_chunks(specialty: Specialty, profiles: Profiles | None) -> list[str]:
    """Header document + one chunk per profile phrase group. Every chunk starts with
    "Chuyên khoa" (E5 models use that to add the "passage:" prefix)."""
    return [specialty_document(specialty)] + [f"Chuyên khoa {specialty.name}: {line}"
                                              for line in profile_for(specialty.name, profiles)]


class EmbeddingRouter:
    """Dense router. With profiles, each specialty has several chunks and its score is the
    max similarity over them (max-sim): one long document mixing 50 symptoms would average
    them into a blurry vector."""

    def __init__(self, embedder: Embedder, specialties: list[Specialty], refusal_threshold: float,
                 profiles: Profiles | None = None):
        self.name = f"embedding[{embedder.model_id}]" + ("+profiles" if profiles else "")
        self._embedder = embedder
        self._specialties = list(specialties)
        self.refusal_threshold = refusal_threshold
        texts, owners = [], []
        for i, s in enumerate(specialties):
            for chunk in specialty_chunks(s, profiles):
                texts.append(chunk)
                owners.append(i)
        self._owners = np.asarray(owners)
        self._matrix = self._unit_rows(np.asarray(embedder.embed(texts)))

    @staticmethod
    def _unit_rows(m: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(m, axis=-1, keepdims=True)
        return m / np.where(norms == 0, 1, norms)

    def rank(self, query: str) -> list[Ranked]:
        q = self._unit_rows(np.asarray(embed_query(self._embedder, query), dtype=float))
        chunk_scores = self._matrix @ q
        scores = np.full(len(self._specialties), -np.inf)
        np.maximum.at(scores, self._owners, chunk_scores)
        order = np.argsort(-scores, kind="stable")
        return [Ranked(self._specialties[i], float(scores[i])) for i in order]

    def route(self, query: str) -> RoutingResult:
        ranked = self.rank(query)
        return RoutingResult(refused=ranked[0].score < self.refusal_threshold, ranked=ranked[:5])
