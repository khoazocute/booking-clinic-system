from functools import lru_cache
from dataclasses import dataclass
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


@dataclass(frozen=True)
class LlmConfig:
    provider: str                    # gemini | openai
    api_key: str
    base_url: str | None             # None = the OpenAI default
    chat_model: str
    fallback_models: tuple[str, ...]
    embedding_model: str
    embedding_dimensions: int | None

    def chat_model_instance(self, temperature: float | None = 0.2, model: str | None = None):
        from app.llm import OpenAIChatModel
        return OpenAIChatModel(self.api_key, model or self.chat_model, temperature=temperature,
                               base_url=self.base_url, provider=self.provider,
                               fallback_models=() if model else self.fallback_models)

    def embedder(self, patient: bool = False):
        from app.retrieval.embedding import OpenAIEmbedder
        return OpenAIEmbedder(self.api_key, self.embedding_model, base_url=self.base_url, provider=self.provider,
                              dimensions=self.embedding_dimensions, patient=patient)


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

    # LLM provider for the chat agent, staff assist and RAG embeddings.
    # "auto" prefers Gemini (free tier) when GEMINI_API_KEY is set, otherwise OpenAI when OPENAI_API_KEY is set.
    llm_provider: Literal["auto", "gemini", "openai"] = "auto"
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    gemini_chat_model: str = "gemini-3.6-flash"
    # comma-separated, tried in order when the primary model is overloaded / rate limited (common on the free tier)
    gemini_fallback_models: str = "gemini-3.5-flash-lite"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_embedding_dimensions: int = 768  # pgvector HNSW indexes support at most 2000 dimensions

    # RAG retrieval: "auto" = dense for Gemini embeddings (R@1 95% vs 87.5% fused), hybrid otherwise
    retrieval_mode: Literal["auto", "hybrid", "dense"] = "auto"

    max_tool_iterations: int = 5
    max_history_messages: int = 12

    def token(self) -> str:
        return self.internal_token or self.ai_internal_token

    def resolved_provider(self) -> Literal["openai", "bm25", "keyword"]:
        if self.embedding_provider == "auto":
            return "bm25"
        return self.embedding_provider

    def llm(self, provider: str | None = None) -> "LlmConfig | None":
        """The resolved LLM configuration, or None when no key is configured (free fallback mode)."""
        wanted = provider or self.llm_provider
        if wanted in ("auto", "gemini") and self.gemini_api_key:
            return LlmConfig("gemini", self.gemini_api_key, self.gemini_base_url, self.gemini_chat_model,
                             tuple(m.strip() for m in self.gemini_fallback_models.split(",") if m.strip()),
                             self.gemini_embedding_model, self.gemini_embedding_dimensions)
        if wanted in ("auto", "openai") and self.openai_api_key:
            return LlmConfig("openai", self.openai_api_key, None, self.chat_model, (), self.embedding_model, None)
        return None

    def resolved_retrieval_mode(self, provider: str | None) -> str:
        if self.retrieval_mode != "auto":
            return self.retrieval_mode
        return "dense" if provider == "gemini" else "hybrid"

    def chat_enabled(self) -> bool:
        return self.llm() is not None


@lru_cache
def get_settings() -> Settings:
    return Settings()
