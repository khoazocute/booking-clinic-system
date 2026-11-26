"""Eval dataset loading and metrics. Same definitions as the Java ``RoutingEvaluator``,
plus red-flag false-alarm rate (the Java baseline has no detector to measure)."""

import json
from dataclasses import dataclass
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


@dataclass(frozen=True)
class EvalCase:
    id: str
    split: str
    type: str  # ANSWERABLE | OUT_OF_SCOPE | RED_FLAG
    query: str
    expected: list[str]


@dataclass(frozen=True)
class Prediction:
    refused: bool
    red_flag: bool
    ranked: list[str]
    scores: list[float]
    # the router's ranking ignoring its refusal rule: separates "ranks well" from "refuses well"
    raw_ranked: tuple[str, ...] = ()


def load_cases(path: Path = DATA_DIR / "specialty_routing_v1.json") -> list[EvalCase]:
    return [EvalCase(c["id"], c["split"], c["type"], c["query"], c["expected"])
            for c in json.loads(path.read_text("utf-8"))]


def top1_hit(case: EvalCase, p: Prediction) -> bool:
    return not p.refused and bool(p.ranked) and p.ranked[0] in case.expected


def top3_hit(case: EvalCase, p: Prediction) -> bool:
    return not p.refused and any(name in case.expected for name in p.ranked[:3])


def _rate(pairs, predicate) -> float:
    pairs = list(pairs)
    return sum(1 for c, p in pairs if predicate(c, p)) / len(pairs) if pairs else 0.0


def split_metrics(cases: list[EvalCase], preds: list[Prediction], split: str) -> dict:
    pairs = [(c, p) for c, p in zip(cases, preds) if split == "all" or c.split == split]
    answerable = [(c, p) for c, p in pairs if c.type == "ANSWERABLE"]
    out_of_scope = [(c, p) for c, p in pairs if c.type == "OUT_OF_SCOPE"]
    red_flags = [(c, p) for c, p in pairs if c.type == "RED_FLAG"]
    not_red_flags = [(c, p) for c, p in pairs if c.type != "RED_FLAG"]
    return {
        "split": split,
        "n_answerable": len(answerable),
        "top1": _rate(answerable, top1_hit),
        "top3": _rate(answerable, top3_hit),
        "top1_ranking_only": _rate(answerable, lambda c, p: bool(p.raw_ranked) and p.raw_ranked[0] in c.expected),
        "false_refusal": _rate(answerable, lambda c, p: p.refused),
        "n_out_of_scope": len(out_of_scope),
        "false_answer": _rate(out_of_scope, lambda c, p: not p.refused),
        "n_red_flag": len(red_flags),
        "red_flag_recall": _rate(red_flags, lambda c, p: p.red_flag),
        "red_flag_false_alarm": _rate(not_red_flags, lambda c, p: p.red_flag),
    }


def dev_failures(cases: list[EvalCase], preds: list[Prediction]) -> list[tuple[EvalCase, Prediction]]:
    failed = []
    for c, p in zip(cases, preds):
        if c.split != "dev":
            continue
        if (c.type == "ANSWERABLE" and not top1_hit(c, p)) \
                or (c.type == "OUT_OF_SCOPE" and not p.refused) \
                or (c.type == "RED_FLAG" and not p.red_flag) \
                or (c.type != "RED_FLAG" and p.red_flag):
            failed.append((c, p))
    return failed


def _pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def to_markdown(title: str, cases: list[EvalCase], preds: list[Prediction], notes: list[str] = ()) -> str:
    lines = [f"# Specialty routing eval: {title}", ""]
    lines += [f"- {n}" for n in notes]
    lines += ["", "| Split | Top-1 ↑ | Top-3 ↑ | False refusal ↓ | False answer ↓ | Red-flag recall ↑ | Red-flag false alarm ↓ |",
              "|---|---|---|---|---|---|---|"]
    for split in ("dev", "test", "all"):
        m = split_metrics(cases, preds, split)
        lines.append(f"| {split} (n={m['n_answerable']}/{m['n_out_of_scope']}/{m['n_red_flag']}) | {_pct(m['top1'])} | "
                     f"{_pct(m['top3'])} | {_pct(m['false_refusal'])} | {_pct(m['false_answer'])} | "
                     f"{_pct(m['red_flag_recall'])} | {_pct(m['red_flag_false_alarm'])} |")
    lines += ["", "n = answerable / out-of-scope / red-flag cases.", "",
              "## Dev failures", "", "| Id | Type | Query | Expected | Got |", "|---|---|---|---|---|"]
    for c, p in dev_failures(cases, preds):
        if p.red_flag:
            got = "RED FLAG"
        elif p.refused:
            got = "_refused_"
        else:
            got = ", ".join(f"{n} ({s:.2f})" for n, s in zip(p.ranked[:3], p.scores[:3]))
        lines.append(f"| {c.id} | {c.type} | {c.query} | {', '.join(c.expected)} | {got} |")
    return "\n".join(lines) + "\n"
