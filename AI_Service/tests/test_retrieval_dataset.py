"""The retrieval eval is only meaningful if every gold passage id exists in the knowledge base."""

from collections import Counter

from eval.retrieval_eval import bm25_retriever, knowledge_base, load_questions, metrics


def test_gold_ids_exist_and_splits_are_balanced():
    ids = {d.id for d in knowledge_base()}
    questions = load_questions()
    assert len({q["id"] for q in questions}) == len(questions)
    for q in questions:
        assert q["relevant"] and set(q["relevant"]) <= ids, q["id"]
    assert Counter(q["split"] for q in questions) == {"dev": 20, "test": 20}


def test_metrics_definitions():
    rows = [{"rank": 1}, {"rank": 3}, {"rank": None}, {"rank": 6}]
    m = metrics(rows)
    assert (m["recall@1"], m["recall@3"], m["recall@5"]) == (0.25, 0.5, 0.5)
    assert abs(m["mrr@10"] - (1 + 1 / 3 + 1 / 6) / 4) < 1e-9


def test_bm25_retrieval_baseline_does_not_regress():
    search = bm25_retriever(knowledge_base())
    hits = sum(any(i in q["relevant"] for i in search(q["query"])[:5]) for q in load_questions())
    assert hits / 40 >= 0.9  # measured 92.5% Recall@5 (eval/reports/retrieval-bm25.md)
