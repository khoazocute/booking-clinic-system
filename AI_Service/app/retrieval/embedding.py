"""Dense-embedding specialty router.

The embedder is pluggable (OpenAI now; local sentence-transformers models such as bge-m3 or
multilingual-e5 for the model-comparison notebook), and every embedder is scored by the same
eval harness.
"""

import hashlib
import json
import logging
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


class OpenAIEmbedder:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small", batch_size: int = 128):
        from openai import OpenAI  # imported lazily so tests and the keyword mode need no API key

        self._client = OpenAI(api_key=api_key, timeout=20.0, max_retries=2)
        self._model = model
        self._batch_size = batch_size
        self.model_id = f"openai/{model}"

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), self._batch_size):
            batch = texts[start:start + self._batch_size]
            response = self._client.embeddings.create(model=self._model, input=batch)
            vectors.extend(item.embedding for item in sorted(response.data, key=lambda d: d.index))
        return vectors


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
