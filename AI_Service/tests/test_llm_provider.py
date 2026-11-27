"""Provider selection, model fallback and embedding normalisation. Offline: fake clients only."""

from types import SimpleNamespace as NS

import httpx
import openai
import pytest

from app.config import Settings
from app.llm import OpenAIChatModel
from app.retrieval.embedding import OpenAIEmbedder


def settings(**kw):
    return Settings(_env_file=None, **kw)


def test_auto_prefers_gemini_then_openai_then_free_fallback():
    both = settings(gemini_api_key="g", openai_api_key="o")
    assert both.llm().provider == "gemini"
    assert both.llm("openai").provider == "openai"            # explicit override
    assert settings(openai_api_key="o").llm().provider == "openai"
    assert settings().llm() is None and not settings().chat_enabled()
    assert settings(openai_api_key="o", llm_provider="gemini").llm() is None  # forced provider without its key


def test_gemini_config_uses_the_openai_compatible_endpoint_and_768_dimensions():
    llm = settings(gemini_api_key="g", gemini_fallback_models="m2, m3").llm()
    assert llm.base_url.startswith("https://generativelanguage.googleapis.com/")
    assert llm.fallback_models == ("m2", "m3")
    assert llm.embedding_dimensions == 768
    assert llm.embedder().model_id == "gemini/gemini-embedding-001@768"  # stored per vector: a change re-embeds


def _overloaded():
    return openai.InternalServerError("overloaded", response=httpx.Response(
        503, request=httpx.Request("POST", "https://x")), body=None)


class FakeCompletions:
    def __init__(self, failing_models):
        self.failing, self.calls = set(failing_models), []

    def create(self, **kwargs):
        self.calls.append(kwargs["model"])
        if kwargs["model"] in self.failing:
            raise _overloaded()
        message = NS(content=f"answer from {kwargs['model']}", tool_calls=None)
        return NS(choices=[NS(message=message)], usage=NS(prompt_tokens=10, completion_tokens=5))


def chat_model(failing, fallbacks=("backup",)):
    model = OpenAIChatModel("k", "primary", base_url="https://example.test", provider="gemini",
                            fallback_models=fallbacks)
    completions = FakeCompletions(failing)
    model._client = NS(chat=NS(completions=completions))
    return model, completions


def test_overloaded_primary_falls_back_to_the_next_model():
    model, completions = chat_model({"primary"})
    turn = model.complete([{"role": "user", "content": "hi"}])
    assert turn.content == "answer from backup"
    assert completions.calls == ["primary", "backup"]
    assert model.model_id == "gemini/primary"


def test_all_models_down_raises_so_the_backend_degrades():
    model, _ = chat_model({"primary", "backup"})
    with pytest.raises(openai.InternalServerError):
        model.complete([{"role": "user", "content": "hi"}])


def test_non_retryable_errors_do_not_fall_back():
    model, completions = chat_model(set())

    def bad_request(**kwargs):
        completions.calls.append(kwargs["model"])
        raise openai.BadRequestError("bad", response=httpx.Response(400, request=httpx.Request("POST", "https://x")),
                                     body=None)

    completions.create = bad_request
    with pytest.raises(openai.BadRequestError):
        model.complete([{"role": "user", "content": "hi"}])
    assert completions.calls == ["primary"]  # a broken request would fail on every model


def test_embeddings_request_the_size_and_come_back_unit_length():
    embedder = OpenAIEmbedder("k", "gemini-embedding-001", provider="gemini", dimensions=3)
    seen = {}

    def create(**kwargs):
        seen.update(kwargs)
        return NS(data=[NS(index=0, embedding=[3.0, 4.0, 0.0])])

    embedder._client = NS(embeddings=NS(create=create))
    vector = embedder.embed(["đau họng"])[0]
    assert seen["dimensions"] == 3
    assert vector == pytest.approx([0.6, 0.8, 0.0])


def test_gemini_thought_signature_is_echoed_back_with_the_tool_call():
    """Gemini thinking models reject a follow-up request whose tool call lost its thought_signature (HTTP 400)."""
    from app.agent.agent import ClinicAgent
    from app.agent.tools import ClinicTools
    from app.llm import AssistantTurn, ToolCall
    from app.retrieval.keyword import KeywordRouter
    from eval.fixtures import FixtureBackend
    from tests.fakes import ScriptedChatModel

    signature = {"google": {"thought_signature": "abc"}}
    llm = ScriptedChatModel([AssistantTurn(None, [ToolCall("c1", "suggest_specialty", '{"symptoms": "đau họng"}', signature)]),
                             AssistantTurn("Bạn nên khám Tai mũi họng.")])
    backend = FixtureBackend()
    ClinicAgent(llm, ClinicTools(backend, None, KeywordRouter(backend.list_specialties()))).run(
        [{"role": "user", "content": "đau họng"}])

    assistant = next(m for m in llm.requests[1] if m["role"] == "assistant")
    assert assistant["tool_calls"][0]["extra_content"] == signature


def test_extra_content_is_read_from_sdk_objects():
    from app.llm import _extra
    assert _extra(NS(extra_content={"google": {"thought_signature": "x"}})) == {"google": {"thought_signature": "x"}}
    assert _extra(NS(extra_content=None, model_extra={})) is None
