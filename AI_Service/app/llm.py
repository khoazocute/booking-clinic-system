"""Thin chat-model abstraction so the agent and the LLM router can be tested with scripted fakes."""

from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    arguments: str  # raw JSON string, as produced by the model
    # provider data that must be echoed back with the call, e.g. Gemini's
    # {"google": {"thought_signature": ...}} (required by thinking models for multi-turn tool use)
    extra: dict | None = None


@dataclass(frozen=True)
class AssistantTurn:
    content: str | None
    tool_calls: list[ToolCall] = field(default_factory=list)
    prompt_tokens: int = 0
    completion_tokens: int = 0


class ChatModel(Protocol):
    model_id: str

    def complete(self, messages: list[dict], tools: list[dict] | None = None,
                 json_mode: bool = False) -> AssistantTurn: ...


def stream_turn(llm: ChatModel, messages: list[dict], tools: list[dict] | None = None
                ) -> Iterator[tuple[str, "str | AssistantTurn"]]:
    """Yields ("delta", text) while the model writes, then ("turn", AssistantTurn).

    Models without streaming (test fakes, other providers) fall back to one complete() call.
    """
    stream = getattr(llm, "stream", None)
    if stream is None:
        turn = llm.complete(messages, tools=tools)
        if turn.content and not turn.tool_calls:
            yield "delta", turn.content
        yield "turn", turn
        return
    yield from stream(messages, tools)


def _extra(tool_call) -> dict | None:
    """Provider-specific fields of a tool call (pydantic keeps unknown fields as extras)."""
    value = getattr(tool_call, "extra_content", None)
    if value is None and hasattr(tool_call, "model_extra"):
        value = (tool_call.model_extra or {}).get("extra_content")
    return value if isinstance(value, dict) and value else None


# errors worth retrying on the next model of the chain: overload, rate limit, timeout, network
def _retryable(exc: Exception) -> bool:
    import openai
    return isinstance(exc, (openai.RateLimitError, openai.InternalServerError, openai.APITimeoutError,
                            openai.APIConnectionError))


class OpenAIChatModel:
    """Any OpenAI-compatible chat API: OpenAI itself, or Gemini through its OpenAI-compatible endpoint."""

    def __init__(self, api_key: str, model: str, temperature: float | None = 0.2, timeout: float = 30.0,
                 base_url: str | None = None, provider: str = "openai", fallback_models: tuple[str, ...] = ()):
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout, max_retries=1)
        self._model = model
        self._models = (model, *fallback_models)
        self._temperature = temperature
        self.model_id = f"{provider}/{model}"

    def _kwargs(self, messages, tools, json_mode, model=None) -> dict:
        kwargs: dict = {"model": model or self._model, "messages": messages}
        if self._temperature is not None:
            kwargs["temperature"] = self._temperature
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        return kwargs

    def complete(self, messages, tools=None, json_mode=False):
        response = None
        for i, model in enumerate(self._models):
            try:
                response = self._client.chat.completions.create(**self._kwargs(messages, tools, json_mode, model))
                break
            except Exception as exc:
                if i == len(self._models) - 1 or not _retryable(exc):
                    raise
        return self._to_turn(response)

    @staticmethod
    def _to_turn(response):
        message = response.choices[0].message
        calls = [ToolCall(c.id, c.function.name, c.function.arguments, _extra(c))
                 for c in (message.tool_calls or []) if getattr(c, "type", "function") == "function"]
        usage = response.usage
        return AssistantTurn(message.content, calls,
                             usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0)

    def stream(self, messages, tools=None) -> Iterator[tuple[str, "str | AssistantTurn"]]:
        """Streams text deltas; tool calls arrive in fragments (by index) and are reassembled.
        Falls back to the next model only if nothing was streamed yet."""
        for i, model in enumerate(self._models):
            started = False
            try:
                for event in self._stream_once(messages, tools, model):
                    started = True
                    yield event
                return
            except Exception as exc:
                if started or i == len(self._models) - 1 or not _retryable(exc):
                    raise

    def _stream_once(self, messages, tools, model):
        kwargs = self._kwargs(messages, tools, False, model)
        kwargs["stream"] = True
        kwargs["stream_options"] = {"include_usage": True}

        content: list[str] = []
        calls: dict[int, dict] = {}
        usage = None
        for chunk in self._client.chat.completions.create(**kwargs):
            if getattr(chunk, "usage", None):
                usage = chunk.usage
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if getattr(delta, "content", None):
                content.append(delta.content)
                yield "delta", delta.content
            for fragment in getattr(delta, "tool_calls", None) or []:
                index = fragment.index if fragment.index is not None else len(calls)
                slot = calls.setdefault(index, {"id": None, "name": "", "arguments": ""})
                if fragment.id:
                    slot["id"] = fragment.id
                extra = _extra(fragment)
                if extra:
                    slot["extra"] = extra
                if fragment.function is not None:
                    slot["name"] += fragment.function.name or ""
                    slot["arguments"] += fragment.function.arguments or ""

        tool_calls = [ToolCall(c["id"], c["name"], c["arguments"], c.get("extra")) for _, c in sorted(calls.items())]
        yield "turn", AssistantTurn("".join(content) or None, tool_calls,
                                    usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0)
