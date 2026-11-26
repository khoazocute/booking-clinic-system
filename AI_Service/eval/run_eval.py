"""Specialty-routing eval: every router, same dataset, same metrics.

    py -m eval.run_eval --router keyword               # Java baseline port (offline)
    py -m eval.run_eval --router bm25                  # lexical ranking (offline)
    py -m eval.run_eval --router openai                # dense embeddings      (needs OPENAI_API_KEY)
    py -m eval.run_eval --router hybrid                # embeddings + BM25 RRF (needs OPENAI_API_KEY)
    py -m eval.run_eval --router llm                   # zero-shot LLM classifier (needs OPENAI_API_KEY)
    py -m eval.run_eval --router st --model intfloat/multilingual-e5-small   # local model, see requirements-ml.txt
    py -m eval.run_eval --router all-offline           # keyword + bm25, writes a summary table

Threshold-based routers: the refusal threshold is chosen on DEV only (max dev Top-1 subject to
dev false-answer <= --max-false-answer), then reported on TEST. Embeddings are cached on disk.
"""

import argparse
import csv
import json
from pathlib import Path

from app.config import get_settings
from app.kb.profiles import Profiles, load_specialty_profiles
from app.knowledge import load_specialties_from_file
from app.retrieval.base import SpecialtyRouter
from app.retrieval.embedding import CachedEmbedder, EmbeddingRouter, OpenAIEmbedder
from app.retrieval.hybrid import BM25Router, HybridRouter
from app.retrieval.keyword import KeywordRouter
from app.retrieval.llm_router import LlmRouter
from app.triage import TriagePipeline
from eval.metrics import DATA_DIR, EvalCase, Prediction, load_cases, split_metrics, to_markdown
from eval.paid_api import FLAG_HELP, PAID_KINDS, require_paid_api_consent

ROOT = Path(__file__).parent
REPORT_DIR = ROOT / "reports"
CACHE_DIR = ROOT / ".cache"


def predict(cases: list[EvalCase], router: SpecialtyRouter, safety: bool) -> list[Prediction]:
    preds = []
    pipeline = TriagePipeline(router, max_suggestions=5) if safety else None
    rank_separately = not isinstance(router, LlmRouter)  # LLM: ranking == routing, avoid paying twice
    for case in cases:
        raw = tuple(r.specialty.name for r in router.rank(case.query)[:3]) if rank_separately else ()
        if pipeline:
            r = pipeline.run(case.query)
            pred = Prediction(r.refused, r.emergency is not None,
                              [s.specialty.name for s in r.suggestions], [s.score for s in r.suggestions], raw)
        else:
            r = router.route(case.query)
            pred = Prediction(r.refused, False, [x.specialty.name for x in r.ranked], [x.score for x in r.ranked], raw)
        if not rank_separately:
            pred = Prediction(pred.refused, pred.red_flag, pred.ranked, pred.scores, tuple(pred.ranked[:3]))
        preds.append(pred)
    return preds


def sweep_threshold(cases, router, safety: bool, max_false_answer: float, out_csv: Path) -> float:
    """Candidate thresholds are the midpoints between observed top scores on dev, so this works for
    cosine similarities and unbounded BM25 scores alike."""
    router.refusal_threshold = float("-inf")
    tops = sorted({r.ranked[0].score for c in cases if c.split == "dev" for r in [router.route(c.query)] if r.ranked})
    candidates = [tops[0] - 1e-6] + [(a + b) / 2 for a, b in zip(tops, tops[1:])] + [tops[-1] + 1e-6]

    rows = []
    for t in candidates:
        router.refusal_threshold = t
        dev = split_metrics(cases, predict(cases, router, safety), "dev")
        rows.append({"threshold": round(t, 4), **{k: round(v, 4) for k, v in dev.items() if isinstance(v, float)}})

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    feasible = [r for r in rows if r["false_answer"] <= max_false_answer]
    best = (max(feasible, key=lambda r: (r["top1"], r["threshold"])) if feasible
            else min(rows, key=lambda r: (r["false_answer"], -r["top1"])))
    return best["threshold"]


def build_router(kind: str, model: str | None, specialties, profiles: Profiles | None) -> SpecialtyRouter:
    if kind == "keyword":
        return KeywordRouter(specialties)  # Java parity: never uses profiles
    if kind == "bm25":
        return BM25Router(specialties, profiles=profiles)
    if kind in ("st", "st-hybrid"):
        from eval.local_embedder import SentenceTransformerEmbedder
        embedder = CachedEmbedder(SentenceTransformerEmbedder(model or "intfloat/multilingual-e5-small"),
                                  CACHE_DIR / "embeddings.json")
        if kind == "st-hybrid":
            return HybridRouter(embedder, specialties, 0.0, profiles)
        return EmbeddingRouter(embedder, specialties, 0.0, profiles)

    settings = get_settings()
    if not settings.openai_api_key:
        raise SystemExit("OPENAI_API_KEY is not set (put it in the repo-root .env)")
    if kind == "llm":
        from app.llm import OpenAIChatModel
        return LlmRouter(OpenAIChatModel(settings.openai_api_key, model or settings.chat_model, temperature=0.0),
                         specialties)
    embedder = CachedEmbedder(OpenAIEmbedder(settings.openai_api_key, model or settings.embedding_model),
                              CACHE_DIR / "embeddings.json")
    if kind == "hybrid":
        return HybridRouter(embedder, specialties, 0.0, profiles)
    return EmbeddingRouter(embedder, specialties, 0.0, profiles)


def evaluate(kind: str, model: str | None, safety: bool, max_false_answer: float, use_profiles: bool = True) -> dict:
    cases = load_cases()
    specialties = load_specialties_from_file(DATA_DIR / "specialties.json")
    router = build_router(kind, model, specialties, load_specialty_profiles() if use_profiles else None)
    notes = [f"safety layer (red-flag detector + PII redaction): {'on' if safety else 'off'}"]

    slug = f"{router.name}{'' if safety else '-no-safety'}"
    slug = "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in slug)
    if hasattr(router, "refusal_threshold"):
        threshold = sweep_threshold(cases, router, safety, max_false_answer, REPORT_DIR / f"{slug}-sweep.csv")
        router.refusal_threshold = threshold
        notes.append(f"refusal threshold {threshold:.4f}, chosen on dev (max Top-1 s.t. false answer "
                     f"<= {max_false_answer:.0%}); sweep in {slug}-sweep.csv")

    preds = predict(cases, router, safety)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / f"{slug}.md").write_text(to_markdown(router.name, cases, preds, notes), "utf-8")
    summary = {"router": router.name, "safety": safety, **{s: split_metrics(cases, preds, s) for s in ("dev", "test")}}
    (REPORT_DIR / f"{slug}.json").write_text(json.dumps(summary, indent=2), "utf-8")
    return summary


def summary_table(summaries: list[dict]) -> str:
    def pct(x):
        return f"{x * 100:.1f}%"
    lines = ["| Router (TEST split) | Top-1 | Top-1 ranking only | Top-3 | False refusal | False answer | "
             "Red-flag recall | False alarm |",
             "|---|---|---|---|---|---|---|---|"]
    for s in summaries:
        t = s["test"]
        lines.append(f"| {s['router']}{'' if s['safety'] else ' (no safety)'} | {pct(t['top1'])} | "
                     f"{pct(t['top1_ranking_only'])} | {pct(t['top3'])} | "
                     f"{pct(t['false_refusal'])} | {pct(t['false_answer'])} | {pct(t['red_flag_recall'])} | "
                     f"{pct(t['red_flag_false_alarm'])} |")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--router", default="keyword",
                        choices=["keyword", "bm25", "openai", "hybrid", "llm", "st", "st-hybrid", "all-offline", "all"])
    parser.add_argument("--model", default=None)
    parser.add_argument("--no-safety", action="store_true", help="router only: no red-flag detector / PII redaction")
    parser.add_argument("--no-profiles", action="store_true", help="ablation: retrieval without symptom profiles")
    parser.add_argument("--max-false-answer", type=float, default=0.15)
    parser.add_argument("--allow-paid-api", action="store_true", help=FLAG_HELP)
    args = parser.parse_args()

    kinds = {"all-offline": ["keyword", "bm25"], "all": ["keyword", "bm25", "openai", "hybrid", "llm"]}.get(
        args.router, [args.router])
    paid = [k for k in kinds if k in PAID_KINDS]
    if paid:
        require_paid_api_consent(args.allow_paid_api, f"router(s) {paid}")
    summaries = [evaluate(k, args.model, not args.no_safety, args.max_false_answer, not args.no_profiles) for k in kinds]
    table = summary_table(summaries)
    if len(kinds) > 1:
        (REPORT_DIR / f"summary-{args.router}.md").write_text(table, "utf-8")
    print(table)


if __name__ == "__main__":
    main()
