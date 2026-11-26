from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Local runs read the repo-root .env (one place for the key); Docker passes env vars directly.
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore")

    # Shared secret with the Spring backend. This service is internal: only the backend calls it.
    internal_token: str = ""
    # docker-compose and the root .env call it AI_INTERNAL_TOKEN
    ai_internal_token: str = ""

    backend_base_url: str = "http://localhost:8082"
    backend_timeout_seconds: float = 5.0

    # Triage router. "auto" = BM25 + symptom profiles, the best router measured by eval/run_eval.py
    # (91.4% Top-1 on test vs 71-77% for the embedding variants). "openai" = dense OpenAI embeddings.
    # "keyword" = the old Java-equivalent baseline.
    embedding_provider: Literal["auto", "openai", "bm25", "keyword"] = "auto"
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4.1-mini"

    # Refusal thresholds. Both must come from the dev-split sweep in eval/run_eval.py
    # (see eval/reports/*-sweep.csv), never be hand-picked.
    refusal_threshold: float = 0.30         # cosine, embedding router: replace with the sweep result
    bm25_refusal_threshold: float = 7.0647  # BM25 + profiles, from the dev sweep (eval/reports/bm25_profiles.md)

    # postgresql://user:pass@host:5432/db  -> pgvector store; empty -> in-memory store
    database_url: str = ""

    # Optional cross-encoder reranker over the top hybrid candidates (needs requirements-ml.txt).
    # Empty = off. Chosen by eval/retrieval_eval.py --rerank, see README.
    reranker_model: str = ""
    rerank_candidates: int = 20

    max_tool_iterations: int = 5
    max_history_messages: int = 12

    def token(self) -> str:
        return self.internal_token or self.ai_internal_token

    def resolved_provider(self) -> Literal["openai", "bm25", "keyword"]:
        if self.embedding_provider == "auto":
            return "bm25"
        return self.embedding_provider

    def chat_enabled(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
