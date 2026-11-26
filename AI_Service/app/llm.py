"""Thin chat-model abstraction so the agent and the LLM router can be tested with scripted fakes."""

from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    arguments: str  # raw JSON string, as produced by the model


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


class OpenAIChatModel:
    def __init__(self, api_key: str, model: str, temperature: float | None = 0.2, timeout: float = 30.0):
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, timeout=timeout, max_retries=2)
        self._model = model
        self._temperature = temperature
        self.model_id = f"openai/{model}"

    def _kwargs(self, messages, tools, json_mode) -> dict:
        kwargs: dict = {"model": self._model, "messages": messages}
        if self._temperature is not None:
            kwargs["temperature"] = self._temperature
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        return kwargs

    def complete(self, messages, tools=None, json_mode=False):
        kwargs = self._kwargs(messages, tools, json_mode)
        response = self._client.chat.completions.create(**kwargs)
        message = response.choices[0].message
        calls = [ToolCall(c.id, c.function.name, c.function.arguments)
                 for c in (message.tool_calls or []) if getattr(c, "type", "function") == "function"]
        usage = response.usage
        return AssistantTurn(message.content, calls,
                             usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0)

    def stream(self, messages, tools=None) -> Iterator[tuple[str, "str | AssistantTurn"]]:
        """Streams text deltas; tool calls arrive in fragments (by index) and are reassembled."""
        kwargs = self._kwargs(messages, tools, False)
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
                slot = calls.setdefault(fragment.index, {"id": None, "name": "", "arguments": ""})
                if fragment.id:
                    slot["id"] = fragment.id
                if fragment.function is not None:
                    slot["name"] += fragment.function.name or ""
                    slot["arguments"] += fragment.function.arguments or ""

        tool_calls = [ToolCall(c["id"], c["name"], c["arguments"]) for _, c in sorted(calls.items())]
        yield "turn", AssistantTurn("".join(content) or None, tool_calls,
                                    usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0)
