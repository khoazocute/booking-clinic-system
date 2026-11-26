import os

import pytest

from app.kb.documents import KnowledgeDoc, all_knowledge_docs, doctor_docs, faq_docs
from app.kb.index import KnowledgeIndex
from app.kb.store import InMemoryVectorStore, PgVectorStore
from eval.fixtures import FixtureBackend
from tests.fakes import BagOfWordsEmbedder

backend = FixtureBackend()


def all_docs():
    return all_knowledge_docs(backend.list_specialties(), backend.list_doctors())


def test_faq_is_split_into_one_chunk_per_section():
    docs = faq_docs()
    assert len(docs) == 10
    refund = next(d for d in docs if "hoàn tiền" in d.title)
    assert "24 giờ" in refund.content and "40%" in refund.content


def test_doctor_docs_skip_unbookable_doctors_and_never_contain_contact_data():
    docs = doctor_docs(backend.list_doctors())
    assert {"doctor:8", "doctor:9"}.isdisjoint(d.id for d in docs)  # inactive, expired license
    text = " ".join(d.content for d in docs)
    assert "@example.com" not in text and "0900000001" not in text and "L-001" not in text


def test_sync_only_embeds_new_or_changed_documents():
    embedder = BagOfWordsEmbedder()
    index = KnowledgeIndex(InMemoryVectorStore(), embedder)
    docs = all_docs()

    assert index.sync(docs).embedded == len(docs)
    assert index.sync(docs).embedded == 0

    changed = [KnowledgeDoc(d.id, d.source_type, d.source_id, d.title, d.content + " (cập nhật)")
               if d.id == "specialty:3" else d for d in docs]
    report = index.sync([d for d in changed if d.id != "faq:thong-bao"])
    assert (report.embedded, report.deleted) == (1, 1)


def test_hybrid_search_finds_policy_and_respects_source_filter():
    index = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder())
    index.sync(all_docs())

    hits = index.search("huỷ lịch có được hoàn tiền không")
    assert "hoan-tien" in hits[0].doc.id  # FAQ summary or the detailed refund guide

    doctors_only = index.search("bác sĩ da liễu", source_types=["DOCTOR"])
    assert doctors_only and all(h.doc.source_type == "DOCTOR" for h in doctors_only)


@pytest.mark.skipif(not os.environ.get("PGVECTOR_TEST_URL"), reason="set PGVECTOR_TEST_URL to run against pgvector")
def test_pgvector_store_round_trip():
    store = PgVectorStore(os.environ["PGVECTOR_TEST_URL"])
    store.delete_except(set())
    index = KnowledgeIndex(store, BagOfWordsEmbedder())

    docs = all_docs()
    assert index.sync(docs).embedded == len(docs)
    assert index.sync(docs).embedded == 0  # hashes persisted in Postgres
    assert "hoan-tien" in index.search("huỷ lịch có được hoàn tiền không")[0].doc.id
    assert {h.doc.source_type for h in index.search("bác sĩ", source_types=["DOCTOR"])} == {"DOCTOR"}


def test_guides_are_chunked_by_heading_with_stable_ids():
    from app.kb.loaders import load_guide_docs, split_by_size

    guides = load_guide_docs()
    ids = [d.id for d in guides]
    assert len(ids) == len(set(ids)) and len(guides) >= 40
    assert "guide:huy-lich-va-hoan-tien:muc-hoan-tien-khi-benh-nhan-tu-huy" in ids
    assert all(d.source_type == "GUIDE" and "›" in d.title for d in guides)

    long_text = " ".join(f"Câu số {i} nói về một quy định." for i in range(100))
    pieces = split_by_size(long_text, max_chars=200)
    assert len(pieces) > 1 and all(len(p) <= 260 for p in pieces)
    assert pieces[0].split(". ")[-1].rstrip(".") in pieces[1]  # one-sentence overlap


class KeywordReranker:
    """Fake cross-encoder: scores a passage by whether it contains a marker word."""

    model_id = "test/keyword-reranker"

    def __init__(self, marker: str, fail: bool = False):
        self.marker, self.fail, self.batches = marker, fail, []

    def score(self, query, passages):
        if self.fail:
            raise RuntimeError("model crashed")
        self.batches.append(len(passages))
        return [1.0 if self.marker in p.lower() else 0.0 for p in passages]


def test_reranker_reorders_only_the_first_stage_candidates():
    plain = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder())
    plain.sync(all_docs())
    first_stage = [h.doc.id for h in plain.search("huỷ lịch có được hoàn tiền không", k=10)]

    reranker = KeywordReranker("tài khoản")
    index = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder(), reranker=reranker, rerank_candidates=10)
    index.sync(all_docs())
    hits = index.search("huỷ lịch có được hoàn tiền không", k=3)

    assert reranker.batches == [len(first_stage)]  # one batch, capped at the candidate pool
    assert {h.doc.id for h in hits} <= set(first_stage)  # never pulls in passages stage one didn't find
    assert all(h.rerank_score is not None for h in hits)
    assert [h.rerank_score for h in hits] == sorted((h.rerank_score for h in hits), reverse=True)


def test_reranker_respects_the_source_filter():
    index = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder(), reranker=KeywordReranker("hoàn tiền"))
    index.sync(all_docs())
    hits = index.search("bác sĩ da liễu", source_types=["DOCTOR"])
    assert hits and all(h.doc.source_type == "DOCTOR" for h in hits)


def test_reranker_failure_falls_back_to_hybrid_order():
    plain = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder())
    broken = KnowledgeIndex(InMemoryVectorStore(), BagOfWordsEmbedder(), reranker=KeywordReranker("x", fail=True))
    plain.sync(all_docs())
    broken.sync(all_docs())
    query = "huỷ lịch có được hoàn tiền không"
    assert [h.doc.id for h in broken.search(query)] == [h.doc.id for h in plain.search(query)]


def test_missing_reranker_dependency_disables_the_feature(monkeypatch):
    from app.kb import rerank

    def unavailable(*args, **kwargs):
        raise ImportError("No module named 'sentence_transformers'")

    monkeypatch.setattr(rerank, "CrossEncoderReranker", unavailable)
    assert rerank.load_reranker("") is None
    assert rerank.load_reranker("some/cross-encoder") is None  # logged, not raised: retrieval keeps working
