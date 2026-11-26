import hashlib
import json

from app.llm import AssistantTurn, ToolCall
from app.text import normalize


class BagOfWordsEmbedder:
    """Deterministic stand-in for a real embedding model."""

    model_id = "test/bow"

    def __init__(self):
        self.calls = 0
        self.texts_embedded = 0

    def embed(self, texts):
        self.calls += 1
        self.texts_embedded += len(texts)
        vectors = []
        for text in texts:
            v = [0.0] * 64
            for word in normalize(text).split():
                v[int(hashlib.md5(word.encode()).hexdigest(), 16) % 64] += 1
            vectors.append(v)
        return vectors


class ScriptedChatModel:
    """Returns pre-scripted turns and records every message list it was sent."""

    model_id = "test/scripted"

    def __init__(self, turns: list[AssistantTurn]):
        self._turns = list(turns)
        self.requests: list[list[dict]] = []

    def complete(self, messages, tools=None, json_mode=False):
        self.requests.append([dict(m) for m in messages])
        return self._turns.pop(0) if self._turns else AssistantTurn("(script exhausted)")


def call(name: str, call_id: str = "c1", **arguments) -> AssistantTurn:
    return AssistantTurn(None, [ToolCall(call_id, name, json.dumps(arguments))])
