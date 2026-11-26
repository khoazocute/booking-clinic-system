import json

from app.kb.bm25 import BM25, reciprocal_rank_fusion, tokenize
from app.knowledge import load_specialties_from_file
from app.llm import AssistantTurn
from app.retrieval.hybrid import BM25Router, HybridRouter
from app.retrieval.llm_router import LlmRouter
from eval.metrics import DATA_DIR
from tests.fakes import BagOfWordsEmbedder, ScriptedChatModel

SPECIALTIES = load_specialties_from_file(DATA_DIR / "specialties.json")


def test_tokenizer_keeps_clinical_syllables_and_adds_bigrams():
    tokens = tokenize("Tôi bị đau rát cổ họng, má sưng")
    assert {"rat", "co", "ma", "dau_rat", "co_hong"} <= set(tokens)
    assert "toi" not in tokens


def test_bm25_ranks_matching_document_first():
    bm25 = BM25(["đau dạ dày buồn nôn", "ngứa da nổi mẩn", "ho kéo dài khó thở"])
    scores = bm25.scores("bị đau dạ dày")
    assert scores.argmax() == 0
    assert scores[2] == 0


def test_reciprocal_rank_fusion_rewards_agreement():
    fused = reciprocal_rank_fusion([[0, 1, 2], [1, 0, 2]])
    assert fused[0] == fused[1] > fused[2]


def test_bm25_router_refuses_without_lexical_overlap():
    router = BM25Router(SPECIALTIES)
    assert router.route("asdfgh qwerty").refused
    assert router.route("Tôi bị ợ chua, trào ngược dạ dày").ranked[0].specialty.name == "Tiêu hóa"


def test_hybrid_router_reports_cosine_scores_and_thresholds_on_them():
    router = HybridRouter(BagOfWordsEmbedder(), SPECIALTIES, refusal_threshold=0.99)
    result = router.route("ngứa da nổi mẩn")
    assert result.refused  # bag-of-words cosine never reaches 0.99
    assert all(0 <= r.score <= 1 for r in result.ranked)


def test_llm_router_parses_ids_and_ignores_unknown_ones():
    model = ScriptedChatModel([AssistantTurn(json.dumps({"specialty_ids": [9, 999, 6]}))])
    result = LlmRouter(model, SPECIALTIES).route("đau bụng, buồn nôn")
    assert [r.specialty.name for r in result.ranked] == ["Tiêu hóa", "Thần kinh"]
    assert "Tiêu hóa" in model.requests[0][0]["content"]  # catalog is in the system prompt


def test_llm_router_refuses_on_empty_or_invalid_json():
    assert LlmRouter(ScriptedChatModel([AssistantTurn('{"specialty_ids": []}')]), SPECIALTIES).route("xin chào").refused
    assert LlmRouter(ScriptedChatModel([AssistantTurn("not json")]), SPECIALTIES).route("xin chào").refused
