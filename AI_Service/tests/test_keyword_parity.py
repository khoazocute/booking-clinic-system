"""The Python keyword router must reproduce the Java backend exactly (numbers from
SpecialtyRoutingEvalTest after the whole-word matching fix), so comparisons against the
baseline are apples to apples."""

import pytest

from app.knowledge import load_specialties_from_file
from app.retrieval.keyword import KeywordRouter
from eval.metrics import DATA_DIR, load_cases, split_metrics
from eval.run_eval import predict


def test_matches_java_baseline_numbers():
    cases = load_cases()
    router = KeywordRouter(load_specialties_from_file(DATA_DIR / "specialties.json"))
    m = split_metrics(cases, predict(cases, router, safety=False), "all")

    assert m["top1"] == pytest.approx(28 / 70)          # Java: 40.0%
    assert m["top3"] == pytest.approx(32 / 70)          # Java: 45.7%
    assert m["false_refusal"] == pytest.approx(34 / 70)  # Java: 48.6%
    assert m["false_answer"] == pytest.approx(3 / 17)    # Java: 17.6%
