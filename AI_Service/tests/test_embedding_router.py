from app.retrieval.base import Specialty
from app.retrieval.embedding import CachedEmbedder, EmbeddingRouter
from tests.fakes import BagOfWordsEmbedder

SPECIALTIES = [
    Specialty(1, "Tim mạch", "đau ngực, tim đập nhanh, huyết áp"),
    Specialty(2, "Da liễu", "ngứa, mụn, nổi mẩn"),
]


def test_ranks_most_similar_specialty_first():
    router = EmbeddingRouter(BagOfWordsEmbedder(), SPECIALTIES, refusal_threshold=0.0)
    ranked = router.rank("tôi bị đau ngực và tim đập nhanh")
    assert ranked[0].specialty.name == "Tim mạch"
    assert ranked[0].score > ranked[1].score


def test_refuses_below_threshold():
    router = EmbeddingRouter(BagOfWordsEmbedder(), SPECIALTIES, refusal_threshold=0.2)
    assert router.route("cho hỏi giờ mở cửa").refused
    assert not router.route("ngứa và nổi mẩn khắp người").refused


def test_cache_avoids_repeated_api_calls(tmp_path):
    inner = BagOfWordsEmbedder()
    cached = CachedEmbedder(inner, tmp_path / "cache.json")
    first = cached.embed(["a b", "c d"])
    assert cached.embed(["c d", "a b"]) == [first[1], first[0]]
    assert inner.calls == 1

    reloaded = CachedEmbedder(BagOfWordsEmbedder(), tmp_path / "cache.json")
    assert reloaded.embed(["a b"]) == [first[0]]
