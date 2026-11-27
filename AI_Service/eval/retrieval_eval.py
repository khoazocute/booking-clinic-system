"""RAG retrieval eval: does search_clinic_knowledge put a correct passage in front of the LLM?

    py -m eval.retrieval_eval --retriever bm25                                     # offline, free
    py -m eval.retrieval_eval --retriever dense  --model intfloat/multilingual-e5-small   # local model, free
    py -m eval.retrieval_eval --retriever hybrid --model intfloat/multilingual-e5-small   # production code path
    py -m eval.retrieval_eval --retriever hybrid --model openai --allow-paid-api   # OpenAI embeddings (costs money)
    py -m eval.retrieval_eval --retriever hybrid --rerank cross-encoder/mmarco-mMiniLMv2-L12-H384-v1  # + local reranker

Metrics on 40 labelled questions (dev / test): Recall@1/3/5 (a relevant passage is in the top k) and
MRR@10 (1 / rank of the first relevant passage). The agent passes the top 4 to the LLM, so Recall@3-5
is what bounds answer quality. Also reports what "no RAG" (putting the whole KB in every prompt) would cost.
"""

import argparse
import json
import time
from pathlib import Path

from app.config import get_settings
from app.kb.bm25 import BM25
from app.kb.documents import KnowledgeDoc, all_knowledge_docs
from app.kb.index import KnowledgeIndex
from app.kb.rerank import CrossEncoderReranker
from app.kb.store import InMemoryVectorStore
from app.retrieval.embedding import CachedEmbedder, OpenAIEmbedder, embed_query
from eval.fixtures import FixtureBackend
from eval.metrics import DATA_DIR
from eval.paid_api import FLAG_HELP, require_paid_api_consent

ROOT = Path(__file__).parent
REPORT_DIR = ROOT / "reports"
KS = (1, 3, 5)
TOP = 10  # ranks evaluated (MRR@10)


def load_questions() -> list[dict]:
    return json.loads((DATA_DIR / "kb_retrieval_v1.json").read_text("utf-8"))


def knowledge_base() -> list[KnowledgeDoc]:
    backend = FixtureBackend()
    return all_knowledge_docs(backend.list_specialties(), backend.list_doctors())


def bm25_retriever(docs, depth=TOP):
    bm25 = BM25([d.text_for_embedding for d in docs])

    def search(query: str) -> list[str]:
        scores = bm25.scores(query)
        return [docs[i].id for i in sorted(range(len(docs)), key=lambda i: -scores[i]) if scores[i] > 0][:depth]
    return search


def dense_retriever(docs, embedder, depth=TOP):
    store = InMemoryVectorStore()
    store.upsert(docs, embedder.embed([d.text_for_embedding for d in docs]), embedder.model_id)

    def search(query: str) -> list[str]:
        return [d.id for d, _ in store.search(embed_query(embedder, query), depth, embedder.model_id)]
    return search


def hybrid_retriever(docs, embedder, reranker=None, candidates=20):
    # exactly what the agent's tool uses, reranker included
    index = KnowledgeIndex(InMemoryVectorStore(), embedder, reranker=reranker, rerank_candidates=candidates)
    index.sync(docs)

    def search(query: str) -> list[str]:
        return [h.doc.id for h in index.search(query, k=TOP)]
    return search


def reranked(search, docs, reranker):
    """Rerank the first-stage candidates of BM25 / dense (hybrid reranks inside KnowledgeIndex)."""
    text = {d.id: d.text_for_embedding for d in docs}

    def wrapped(query: str) -> list[str]:
        ids = search(query)
        scores = reranker.score(query, [text[i] for i in ids])
        return [i for _, i in sorted(zip(scores, ids), key=lambda pair: -pair[0])][:TOP]
    return wrapped


def metrics(rows: list[dict]) -> dict:
    n = len(rows) or 1
    out = {f"recall@{k}": sum(r["rank"] is not None and r["rank"] <= k for r in rows) / n for k in KS}
    out["mrr@10"] = sum(1 / r["rank"] for r in rows if r["rank"]) / n
    out["n"] = len(rows)
    return out


def context_stuffing_cost(docs: list[KnowledgeDoc]) -> str:
    """How many tokens the KB costs per LLM call without retrieval (vs ~4 passages with RAG)."""
    text = "\n".join(d.text_for_embedding for d in docs)
    try:
        import tiktoken
        enc = tiktoken.get_encoding("o200k_base")  # GPT-4.1 / 4o tokenizer
        whole, per_doc = len(enc.encode(text)), [len(enc.encode(d.text_for_embedding)) for d in docs]
        avg4 = round(4 * sum(per_doc) / len(per_doc))
        return (f"- whole knowledge base: {len(docs)} chunks, ~{whole:,} tokens per LLM call without RAG; "
                f"top-4 retrieval: ~{avg4:,} tokens ({whole / avg4:.0f}x less, on every one of the "
                f"agent's 2-5 LLM calls per turn)")
    except ImportError:
        return f"- whole knowledge base: {len(docs)} chunks, {len(text):,} characters (install tiktoken for token counts)"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--retriever", choices=["bm25", "dense", "hybrid"], default="bm25")
    parser.add_argument("--model", default="intfloat/multilingual-e5-small",
                        help="sentence-transformers model name, or 'openai' (paid) / 'gemini' (free tier)")
    parser.add_argument("--rerank", default="", help="cross-encoder model to rerank the first-stage candidates")
    parser.add_argument("--candidates", type=int, default=20, help="first-stage candidates passed to the reranker")
    parser.add_argument("--allow-paid-api", action="store_true", help=FLAG_HELP)
    args = parser.parse_args()

    docs = knowledge_base()
    reranker = CrossEncoderReranker(args.rerank) if args.rerank else None
    depth = args.candidates if reranker else TOP
    if args.retriever == "bm25":
        name, search = "bm25", bm25_retriever(docs, depth)
    else:
        if args.model in ("openai", "gemini"):
            require_paid_api_consent(args.allow_paid_api, f"{args.model} embeddings")
            llm = get_settings().llm(args.model)
            if llm is None:
                raise SystemExit(f"No API key for {args.model} in the repo-root .env")
            inner = llm.embedder(patient=True)
        else:
            from eval.local_embedder import SentenceTransformerEmbedder
            inner = SentenceTransformerEmbedder(args.model)
        embedder = CachedEmbedder(inner, ROOT / ".cache" / "embeddings.json")
        name = f"{args.retriever}[{embedder.model_id}]"
        if args.retriever == "dense":
            search = dense_retriever(docs, embedder, depth)
        else:
            search = hybrid_retriever(docs, embedder, reranker, args.candidates)
    if reranker:
        if args.retriever != "hybrid":
            search = reranked(search, docs, reranker)
        name += f"+rerank[{reranker.model_id}@{args.candidates}]"

    known = {d.id for d in docs}
    rows, latencies = [], []
    for q in load_questions():
        unknown = set(q["relevant"]) - known
        if unknown:
            raise SystemExit(f"{q['id']}: relevant ids not in the knowledge base: {unknown}")
        started = time.perf_counter()
        ranked = search(q["query"])
        latencies.append(time.perf_counter() - started)
        rank = next((i + 1 for i, doc_id in enumerate(ranked) if doc_id in q["relevant"]), None)
        rows.append({**q, "rank": rank, "top3": ranked[:3]})

    latencies.sort()
    latency = (f"- search latency on this machine (CPU, embedding cache warm): median "
               f"{latencies[len(latencies) // 2] * 1000:.0f} ms, max {latencies[-1] * 1000:.0f} ms")
    lines = [f"# RAG retrieval eval: {name}", "", context_stuffing_cost(docs), latency, "",
             "| Split | n | Recall@1 | Recall@3 | Recall@5 | MRR@10 |", "|---|---|---|---|---|---|"]
    summary = {"retriever": name, "median_latency_ms": round(latencies[len(latencies) // 2] * 1000)}
    for split in ("dev", "test", "all"):
        m = metrics([r for r in rows if split == "all" or r["split"] == split])
        summary[split] = m
        lines.append(f"| {split} | {m['n']} | {m['recall@1']:.1%} | {m['recall@3']:.1%} | "
                     f"{m['recall@5']:.1%} | {m['mrr@10']:.3f} |")
    lines += ["", "## Dev misses (relevant passage not ranked first)", "",
              "| Id | Query | Rank of first relevant | Top 3 |", "|---|---|---|---|"]
    for r in rows:
        if r["split"] == "dev" and r["rank"] != 1:
            lines.append(f"| {r['id']} | {r['query']} | {r['rank'] or '>10'} | {', '.join(r['top3'])} |")

    slug = "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in name)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / f"retrieval-{slug}.md").write_text("\n".join(lines) + "\n", "utf-8")
    (REPORT_DIR / f"retrieval-{slug}.json").write_text(json.dumps(summary, indent=2), "utf-8")
    print("\n".join(lines[:10]))


if __name__ == "__main__":
    main()
