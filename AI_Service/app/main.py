"""AI_Service HTTP API (internal; called only by the Spring backend).

    GET  /health             liveness, index state, active router / chat model
    POST /v1/triage          emergency check + specialty suggestion for one patient message
    POST /v1/chat            RAG + tool-calling chat turn
    POST /v1/chat/stream     the same turn as server-sent events (tool status, checked sentences, result)
    POST /v1/support/assist  summary + draft reply for clinic staff (human-in-the-loop)
    POST /v1/index/rebuild   reload specialties/doctors from the backend, re-embed what changed
"""

import hmac
import json
import logging
import threading
from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from pydantic.alias_generators import to_camel

from app.agent.agent import ChatResult, ClinicAgent
from app.agent.assist import StaffAssistant
from app.agent.tools import ClinicTools
from app.backend_client import BackendClient, HttpBackendClient
from app.config import Settings, get_settings
from app.kb.documents import all_knowledge_docs
from app.kb.index import KnowledgeIndex
from app.kb.rerank import load_reranker
from app.kb.profiles import load_specialty_profiles
from app.kb.store import InMemoryVectorStore, PgVectorStore
from app.llm import OpenAIChatModel
from app.retrieval.base import Specialty, SpecialtyRouter
from app.retrieval.embedding import EmbeddingRouter, OpenAIEmbedder
from app.retrieval.hybrid import BM25Router
from app.retrieval.keyword import KeywordRouter
from app.triage import TriagePipeline

log = logging.getLogger("ai_service")


# ---------- API models (camelCase on the wire, like the Spring API) ----------

class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TriageRequest(CamelModel):
    message: Annotated[str, StringConstraints(min_length=1, max_length=2000)]


class Emergency(CamelModel):
    category: str
    message: str


class Suggestion(CamelModel):
    specialty_id: int
    name: str
    score: float


class TriageResponse(CamelModel):
    emergency: Emergency | None
    refused: bool
    answer: str
    suggestions: list[Suggestion]
    pii_redacted: int
    router: str


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(min_length=1, max_length=2000)]


class ChatRequest(CamelModel):
    messages: Annotated[list[ChatMessage], Field(min_length=1, max_length=20)]


class Citation(CamelModel):
    ref: str
    title: str
    source_type: str
    source_id: int | None


class ChatResponse(CamelModel):
    answer: str
    emergency: Emergency | None
    citations: list[Citation]
    doctors: list[dict]
    slots: list[dict]
    booking_proposal: dict | None
    handoff_suggested: bool = False
    handoff_reason: str | None = None
    output_blocked: bool = False
    tool_calls: list[str]
    model: str
    prompt_tokens: int
    completion_tokens: int


class AssistMessage(CamelModel):
    role: Literal["patient", "staff"]
    content: Annotated[str, StringConstraints(min_length=1, max_length=2000)]


class AssistRequest(CamelModel):
    messages: Annotated[list[AssistMessage], Field(min_length=1, max_length=40)]
    ai_transcript: Annotated[str, StringConstraints(max_length=40000)] | None = None
    reason: Annotated[str, StringConstraints(max_length=40)] | None = None


class AssistResponse(CamelModel):
    summary: str
    suggested_reply: str
    sources: list[Citation]
    output_blocked: bool
    pii_redacted: int
    model: str
    prompt_tokens: int
    completion_tokens: int


# ---------- wiring ----------

@dataclass
class Runtime:
    triage: TriagePipeline
    agent: ClinicAgent | None

    @property
    def assistant(self) -> StaffAssistant | None:
        return StaffAssistant(self.agent.llm, self.agent.tools.knowledge) if self.agent else None


def sse(event: dict) -> str:
    """One server-sent event: a single `data:` line of JSON, terminated by a blank line."""
    return "data: " + json.dumps(event, ensure_ascii=False, default=str) + "\n\n"


def to_chat_response(result: ChatResult, agent: ClinicAgent) -> "ChatResponse":
    a = result.artifacts
    return ChatResponse(
        answer=result.answer,
        emergency=Emergency(category=result.emergency.category, message=result.emergency.message)
        if result.emergency else None,
        citations=[Citation(ref=ref, title=a.citations[ref].title, source_type=a.citations[ref].source_type,
                            source_id=a.citations[ref].source_id) for ref in result.cited],
        doctors=a.doctors, slots=a.slots, booking_proposal=a.proposal,
        handoff_suggested=result.handoff_suggested,
        handoff_reason=a.handoff_reason or ("AGENT_GAVE_UP" if result.handoff_suggested else None),
        output_blocked=result.output_blocked,
        tool_calls=a.tool_calls,
        model=agent.llm.model_id, prompt_tokens=result.prompt_tokens, completion_tokens=result.completion_tokens,
    )


def default_router_factory(settings: Settings, specialties: list[Specialty]) -> SpecialtyRouter:
    provider = settings.resolved_provider()
    profiles = load_specialty_profiles()
    if provider == "openai":
        embedder = OpenAIEmbedder(settings.openai_api_key, settings.embedding_model)
        return EmbeddingRouter(embedder, specialties, settings.refusal_threshold, profiles)
    if provider == "bm25":
        return BM25Router(specialties, settings.bm25_refusal_threshold, profiles)
    return KeywordRouter(specialties)


class DefaultAgentFactory:
    """Builds the chat agent when an OpenAI key is configured. The knowledge index (and its
    vector store) lives across rebuilds, so a rebuild only re-embeds documents that changed."""

    def __init__(self):
        self._index: KnowledgeIndex | None = None

    def __call__(self, settings: Settings, backend: BackendClient, specialties: list[Specialty],
                 doctors: list[dict], triage_router: SpecialtyRouter) -> ClinicAgent | None:
        if not settings.chat_enabled():
            return None
        if self._index is None:
            store = PgVectorStore(settings.database_url) if settings.database_url else InMemoryVectorStore()
            # no disk cache here: the store keeps content hashes, so only changed docs are re-embedded
            self._index = KnowledgeIndex(store, OpenAIEmbedder(settings.openai_api_key, settings.embedding_model),
                                         reranker=load_reranker(settings.reranker_model),
                                         rerank_candidates=settings.rerank_candidates)
        self._index.sync(all_knowledge_docs(specialties, doctors))
        llm = OpenAIChatModel(settings.openai_api_key, settings.chat_model)
        return ClinicAgent(llm, ClinicTools(backend, self._index, triage_router),
                           max_iterations=settings.max_tool_iterations, max_history=settings.max_history_messages)


def create_app(
    settings: Settings | None = None,
    backend: BackendClient | None = None,
    router_factory: Callable[[Settings, list[Specialty]], SpecialtyRouter] = default_router_factory,
    agent_factory: Callable[..., ClinicAgent | None] | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    backend = backend or HttpBackendClient(settings.backend_base_url, settings.backend_timeout_seconds)
    agent_factory = agent_factory or DefaultAgentFactory()

    app = FastAPI(title="Booking Clinic AI Service", version="0.2.0")
    state: dict[str, Runtime | None] = {"runtime": None}
    lock = threading.Lock()

    def rebuild() -> dict:
        with lock:  # one rebuild at a time; requests keep using the previous runtime meanwhile
            specialties = backend.list_specialties()
            doctors = backend.list_doctors()
            router = router_factory(settings, specialties)
            runtime = Runtime(TriagePipeline(router), agent_factory(settings, backend, specialties, doctors, router))
            state["runtime"] = runtime  # atomic swap
        log.info("runtime rebuilt: %d specialties, %d doctors, router=%s, chat=%s", len(specialties), len(doctors),
                 router.name, runtime.agent.llm.model_id if runtime.agent else "disabled")
        return {"specialties": len(specialties), "doctors": len(doctors)}

    def runtime() -> Runtime:
        if state["runtime"] is None:
            try:
                rebuild()  # lazy: the backend may start after this service
            except Exception as exc:  # backend down, embedding API down...
                log.warning("index not available: %s", exc)
                raise HTTPException(503, "AI index not ready") from exc
        return state["runtime"]

    def require_internal_token(x_internal_token: str = Header(default="")) -> None:
        if not settings.token():
            raise HTTPException(503, "INTERNAL_TOKEN is not configured")  # fail closed
        if not hmac.compare_digest(x_internal_token.encode(), settings.token().encode()):
            raise HTTPException(401, "invalid internal token")

    @app.get("/health")
    def health() -> dict:
        current = state["runtime"]
        return {"status": "ok", "indexReady": current is not None,
                "router": current.triage.router.name if current else None,
                "chatModel": current.agent.llm.model_id if current and current.agent else None}

    @app.post("/v1/triage", response_model=TriageResponse, response_model_by_alias=True,
              dependencies=[Depends(require_internal_token)])
    def triage(request: TriageRequest) -> TriageResponse:
        pipeline = runtime().triage
        result = pipeline.run(request.message)
        return TriageResponse(
            emergency=Emergency(category=result.emergency.category, message=result.emergency.message)
            if result.emergency else None,
            refused=result.refused,
            answer=result.answer,
            suggestions=[Suggestion(specialty_id=r.specialty.id, name=r.specialty.name, score=round(r.score, 4))
                         for r in result.suggestions],
            pii_redacted=result.pii_redacted,
            router=pipeline.router.name,
        )

    def chat_agent(request: ChatRequest) -> ClinicAgent:
        if request.messages[-1].role != "user":
            raise HTTPException(422, "the last message must come from the user")
        agent = runtime().agent
        if agent is None:
            raise HTTPException(503, "chat is not configured (OPENAI_API_KEY missing)")
        return agent

    @app.post("/v1/chat", response_model=ChatResponse, response_model_by_alias=True,
              dependencies=[Depends(require_internal_token)])
    def chat(request: ChatRequest) -> ChatResponse:
        agent = chat_agent(request)
        try:
            result = agent.run([m.model_dump() for m in request.messages])
        except Exception as exc:  # LLM API down / rate limited: let the backend degrade gracefully
            log.error("chat failed: %s", exc)
            raise HTTPException(503, "chat model unavailable") from exc
        return to_chat_response(result, agent)

    @app.post("/v1/chat/stream", dependencies=[Depends(require_internal_token)])
    def chat_stream(request: ChatRequest) -> StreamingResponse:
        """Server-sent events: {"type": "status", "tool"}, {"type": "delta", "text"} (whole checked sentences),
        then {"type": "done", "result": <same body as /v1/chat>} or {"type": "error"}."""
        agent = chat_agent(request)
        history = [m.model_dump() for m in request.messages]

        def events():
            try:
                for event in agent.run_events(history):
                    if event["type"] == "result":
                        event = {"type": "done",
                                 "result": to_chat_response(event["result"], agent).model_dump(by_alias=True)}
                    yield sse(event)
            except Exception as exc:  # the backend falls back to its degraded answer
                log.error("chat stream failed: %s", exc)
                yield sse({"type": "error", "message": "chat model unavailable"})

        return StreamingResponse(events(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    @app.post("/v1/support/assist", response_model=AssistResponse, response_model_by_alias=True,
              dependencies=[Depends(require_internal_token)])
    def support_assist(request: AssistRequest) -> AssistResponse:
        assistant = runtime().assistant
        if assistant is None:
            raise HTTPException(503, "assist is not configured (OPENAI_API_KEY missing)")
        try:
            result = assistant.run([m.model_dump() for m in request.messages], request.ai_transcript, request.reason)
        except Exception as exc:
            log.error("support assist failed: %s", exc)
            raise HTTPException(503, "assist model unavailable") from exc
        return AssistResponse(
            summary=result.summary, suggested_reply=result.reply,
            sources=[Citation(ref=ref, title=doc.title, source_type=doc.source_type, source_id=doc.source_id)
                     for ref, doc in result.sources],
            output_blocked=result.output_blocked, pii_redacted=result.pii_redacted,
            model=assistant.llm.model_id, prompt_tokens=result.prompt_tokens, completion_tokens=result.completion_tokens,
        )

    @app.post("/v1/index/rebuild", dependencies=[Depends(require_internal_token)])
    def rebuild_index() -> dict:
        try:
            return rebuild()
        except Exception as exc:
            log.error("index rebuild failed, keeping previous index: %s", exc)
            raise HTTPException(503, "index rebuild failed; previous index kept") from exc

    return app


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
app = create_app()
