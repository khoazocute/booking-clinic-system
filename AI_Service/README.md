# Booking Clinic AI Service

Python (FastAPI) service behind the patient assistant of Booking Clinic.

- **Agentic RAG chat.** Answers clinic questions with citations, suggests a specialty, finds doctors and
  free slots, and prepares a booking proposal that the patient confirms.
- **Triage.** Detects emergencies, redacts personal data and routes symptoms to a specialty.
- **Evaluation.** Every component is measured on a labelled Vietnamese dataset (accuracy *and* safety).

## Architecture

```
React widget ──JWT──► Spring Boot  (auth, MySQL, booking, payments, rate limit)
                         │  X-Internal-Token, internal Docker network only (no published port)
                         ▼
                      AI_Service (FastAPI)
                         ├─ 1. red-flag rules ─► fixed "call 115" template (no model call)
                         ├─ 2. PII redaction   ─► only redacted text reaches OpenAI
                         ├─ 3. agent loop (OpenAI tool calling, ≤ 5 rounds)
                         │     ├─ search_clinic_knowledge ─► hybrid retrieval: pgvector (HNSW) + BM25, RRF
                         │     │                             (+ optional cross-encoder reranker)
                         │     ├─ suggest_specialty       ─► evaluated triage router
                         │     ├─ find_doctors / get_available_slots ─► backend PUBLIC read APIs
                         │     ├─ propose_booking         ─► validated proposal, NOT a booking
                         │     └─ offer_human_support     ─► shows a "talk to staff" button, contacts NO ONE
                         └─ 4. output guard (no drug dosage) + citation check
```

| Rule | Why |
|---|---|
| The AI never writes clinic data and never sees the patient's JWT | LLM output is untrusted. The agent only *proposes* a slot. The patient's click on "Xác nhận đặt lịch & thanh toán" calls the normal `POST /appointments` with the patient's own JWT (ownership checks, atomic slot locking), then opens the payment step. |
| Emergencies are deterministic rules that run before the LLM | They must work when the model is down, and the model can't rephrase them. |
| Structured results (doctors, slots, proposal, citations) come from tool executions, not model text | The UI never acts on hallucinated IDs. Citations the model invents are dropped. |
| Knowledge = specialties (+ symptom profiles), bookable doctors, `knowledge/faq.md`, and every `.md/.txt/.pdf` in `knowledge/docs/` | 74 chunks (about 8k tokens). Clinic-process documents are written only from rules in the backend code. `chuan-bi-truoc-khi-kham.md` and `khi-nao-can-di-cap-cuu.md` are general guidance marked for review by medical staff. Drop real clinic PDFs into `knowledge/docs/` and they are chunked and indexed. |
| Incremental indexing (content hash per chunk, model id per vector) | A re-index only embeds what changed. Switching the embedding model re-embeds everything. |
| Spring falls back to its local keyword router if this service is down | The feature degrades instead of failing. |
| Human handoff is offered, never forced or faked | `handoffSuggested` is true when the model calls `offer_human_support` (patient asks for a person, complaint, own payment problem, out of scope), when the agent gives up, or when Spring is in degraded mode. Never over an emergency: 115 comes first. The patient presses "Gặp tư vấn viên", chooses whether to share the AI chat, and Spring opens a support ticket that clinic staff answer at `/admin/support` (STOMP push + polling). |

### Streaming, history, feedback and agent assist

| Feature | Design |
|---|---|
| Streaming (`POST /v1/chat/stream`, SSE) | Events: tool status ("Đang tìm bác sĩ..."), then text, then the full result. Text is released **one whole sentence at a time, after the output guard has checked it** (`SentenceGate`). A token stream would show "500 mg" before any filter could see it. `run()` drains the same generator, so the streaming and non-streaming paths can't drift apart. |
| Server-side history | Spring stores conversations (`ai_conversations`, `ai_messages`) and builds the model's context from the database. The client sends only the new message, so it can't inject forged "assistant" turns. The chat survives a reload. |
| Telemetry + LLMOps (`/admin/ai`) | Every assistant turn records source (agent / stream / fallback), model, tools, tokens, estimated cost, latency, emergency, handoff, output-guard block and the patient's thumbs up / down. The dashboard shows satisfaction, p95 latency, cost per turn, fallback and handoff rates, tool usage, and a per-conversation trace, with filters for downvoted, handoff, emergency, degraded and blocked conversations. |
| Agent assist (`POST /v1/support/assist`) | For staff answering a support ticket: a summary plus a draft reply, grounded in retrieved clinic rules with `[K1]` citations. Facts staff must check stay as `[placeholders]`. Patient data is redacted before the LLM call, and a draft that mentions a dosage is dropped. The draft is **never sent automatically**. The share of staff replies that started from a draft is measured on the dashboard. |
| Cost guards (Spring) | Per patient: 10 per minute and 40 per day. System-wide daily budget: once reached, answers switch to the free keyword fallback instead of failing. Set a spend limit on the OpenAI project as the hard backstop. |

Index sync: Spring publishes an event when specialties or doctors change. After the transaction commits,
it calls `POST /v1/index/rebuild` asynchronously. A 15-minute reconciliation job repairs any missed sync.

## Evaluation

### 1. Specialty routing: `eval/run_eval.py`

Dataset `eval/data/specialty_routing_v1.json`: 103 hand-labelled Vietnamese queries, split into
70 answerable, 17 out-of-scope and 16 emergencies, and into `dev` and `test` halves.
Thresholds are tuned on dev only. Numbers below are on **test**, with the safety layer on.

"Ranking only" is Top-1 if the router never refused. It separates *ranks well* from *refuses well*.
All rows except the first include the safety layer and the pediatrics rule.

| Router | Top-1 | Ranking only | Top-3 | False refusal ↓ | False answer ↓ |
|---|---|---|---|---|---|
| Original backend (substring keywords, no safety) | 40.0%* | n/a | 54.3%* | 14.3%* | 87.5%* |
| Keyword, whole-word match | 42.9% | 40.0% | 48.6% | 42.9% | 25.0% |
| BM25 | 62.9% | 62.9% | 74.3% | 22.9% | 12.5% |
| **BM25 + symptom profiles** (runtime default) | **91.4%** | **94.3%** | **94.3%** | **5.7%** | **0%** |
| multilingual-e5-small + profiles | 71.4% | 80.0% | 80.0% | 20.0% | 0% |
| e5-small + BM25 hybrid + profiles | 74.3% | 82.9% | 80.0% | 20.0% | 0% |
| multilingual-e5-base + profiles | 71.4% | 68.6% | 82.9% | 11.4% | 0% |
| e5-base + BM25 hybrid + profiles | 77.1% | 82.9% | 88.6% | 11.4% | 0% |
| OpenAI embeddings / hybrid / LLM classifier | _run with key_ | | | | |

Red-flag recall is 100% and the false-alarm rate is 0% for every row with the safety layer.

\* measured on the original Java code, which had substring-matching bugs: `"ho"` matched inside `"khong"`, `"da"` inside `"dau"`.

What moved the numbers, in order of impact:

1. **Data, not models: document expansion.** Specialty descriptions are about 30 words. Adding per-specialty symptom
   profiles (`knowledge/specialty_profiles.md`, edited from DEV failures only) took BM25 from 62.9% to 91.4% Top-1.
   Before that, every router plateaued at about 60% "ranking only", whatever the model.
2. **Refusal is the bottleneck for dense models.** e5 rankings are close to BM25's, but their cosine scores are
   compressed, so a threshold that keeps false answers low also refuses many valid questions.
   Hence the "ranking only" column.
3. **Max-sim over chunks.** Each profile line is embedded separately, and a specialty scores its best chunk, so a long
   symptom list doesn't average into one blurry vector.
4. **Domain rule: children go to Pediatrics.** It was found in one DEV failure and gave +1 test case for every router.
5. **A bigger embedding model (e5-base vs e5-small) didn't help** on this data.

Caveats (read before quoting the numbers):

- **Same author bias.** The dataset, the symptom profiles and the red-flag rules were written by the same person, so the
  high numbers are an **upper bound**. Dev (94.3%) and test (91.4%) agree, so there's no sign of overfitting to dev,
  but shared vocabulary can't be ruled out. The next step is an independent test set: classmates or clinicians writing
  queries without seeing the profiles, or LLM-generated paraphrases.
- **The dataset is small** (35 answerable cases per split), so ±1 case is ±2.9 points.
- **Accent stripping stays ambiguous.** `đã`/`đá`/`da` and `tìm`/`tim` can't be told apart without diacritics.
- **bge-m3 is not evaluated yet:** it needs about 2.5 GB of free RAM.

### 2. RAG retrieval: `eval/retrieval_eval.py`

Does `search_clinic_knowledge` put a correct passage in front of the LLM? The dataset `eval/data/kb_retrieval_v1.json`
has 40 user-style questions (20 dev, 20 test), each labelled with its relevant chunk ids. They cover booking,
payment, refunds, the after-visit flow, accounts, the assistant itself, visit preparation, emergencies, doctors and
specialties. Retrieval runs over the full 74-chunk knowledge base.

All 40 questions, local models only (no paid API):

| Retriever | Recall@1 | Recall@3 | Recall@5 | MRR@10 |
|---|---|---|---|---|
| BM25 | 72.5% | 87.5% | 92.5% | 0.810 |
| Dense, multilingual-e5-small | 85.0% | 92.5% | 92.5% | 0.895 |
| Hybrid (e5-small + BM25, RRF), production code path | 82.5% | 92.5% | **97.5%** | 0.883 |
| Dense, multilingual-e5-base | 82.5% | 95.0% | 95.0% | 0.891 |
| Hybrid (e5-base + BM25) | 85.0% | 92.5% | **97.5%** | **0.896** |
| Hybrid with OpenAI `text-embedding-3-small` (runtime) | _not run: needs `--allow-paid-api`_ | | | |

- **Opposite of specialty routing.** For routing, curated vocabulary made BM25 win. For policy questions, users
  paraphrase ("trả tiền" vs "thanh toán", "dời giờ" vs "đổi giờ", "chatbot" vs "trợ lý AI"), and dense retrieval
  wins (MRR 0.81 → 0.89).
- **Hybrid has the best Recall@5.** The agent passes the top 4 passages to the LLM, which is why hybrid is the
  runtime retriever.
- **Why RAG at all.** The whole knowledge base is about 7.9k tokens, and the agent makes 2–5 LLM calls per turn. Top-4
  retrieval sends about 430 tokens instead, roughly 19x less per call. It also gives one precise citation instead of
  "somewhere in the prompt". Both numbers are printed by the eval, measured with the GPT-4.1 tokenizer.
- **Caveats.** Same author bias as above. With 20 questions per split, one question is 5 points, so the dense
  vs hybrid differences are within noise. BM25 vs dense is the robust finding.

#### Second stage: cross-encoder reranker (`--rerank`)

`KnowledgeIndex` can rerank its top N first-stage candidates with a cross-encoder (`app/kb/rerank.py`),
which reads the query and the passage together instead of comparing two separate vectors. Model:
`cross-encoder/mmarco-mMiniLMv2-L12-H384-v1` (118M parameters, multilingual MS MARCO, includes Vietnamese, runs on CPU).
Same 40 questions; latency is the median per search on a laptop CPU.

| First stage → reranker | Split | Recall@1 | Recall@3 | Recall@5 | MRR@10 | Latency |
|---|---|---|---|---|---|---|
| BM25 | dev / test | 70.0 / 75.0% | 80.0 / 95.0% | 90.0 / 95.0% | 0.771 / 0.849 | <1 ms |
| **BM25 → rerank top 10** | dev / test | **90.0 / 80.0%** | **95.0 / 95.0%** | 95.0 / 95.0% | **0.925 / 0.867** | ~0.3 s |
| Hybrid e5-small (runtime path) | dev / test | 85.0 / 80.0% | 90.0 / 95.0% | 95.0 / 100% | 0.887 / 0.879 | ~1 ms + embedding |
| Hybrid → rerank top 10 | dev / test | 90.0 / 80.0% | 95.0 / 95.0% | 95.0 / 95.0% | 0.917 / 0.865 | ~1 s |
| Hybrid → rerank top 20 | dev / test | 95.0 / 80.0% | 95.0 / 95.0% | 100 / 95.0% | 0.963 / 0.858 | ~2.5 s |

- **The reranker lifts a cheap lexical first stage to dense quality.** BM25 → rerank improves on *both* splits
  (MRR 0.810 → 0.896 over all 40) and matches the dense retrievers without an embedding model.
- **On top of hybrid it doesn't pay off.** All of the gain is on dev; on test it is flat (Recall@1) or slightly
  worse (MRR). Per question, it fixed 5 and broke 4. The 4 losses are genuine: it promoted a passage on the same
  *topic* that doesn't *answer* the question (for "Who can see my medical record?", the FAQ that says records
  exist, not the guide that says who can open them). Checked against the text, not relabelled.
- **Decision: off by default** (`RERANKER_MODEL` empty). Within noise on 20 test questions, it adds 1–2.5 s of
  CPU per search, and the agent calls search up to several times per turn. It stays one env var away, with
  `pip install -r requirements-ml.txt`. If the reranker fails or isn't installed, search falls back to the hybrid order.
- Revisit with a larger independent question set, or a stronger multilingual reranker (bge-reranker-v2-m3, which needs
  about 2.5 GB of free RAM) on a GPU.

### 3. Chat agent: `eval/chat_eval.py`

21 scenarios run with the real LLM against a fixture backend (`eval/fixtures.py`) and are scored in two ways:

- **Deterministic checks:** required facts present, expected tools called, no dosage, never claims "booked",
  never proposes a booked slot, never invents a doctor, resists prompt-leak and forced-booking requests.
- **LLM-as-judge faithfulness (1–5):** is every concrete claim supported by what the tools returned?

Results: _pending, needs `OPENAI_API_KEY`_. Use a stronger judge model to limit self-grading bias
(`--judge-model`).

### 4. Local embedding models

`--router st|st-hybrid --model <name>` and `retrieval_eval --retriever dense|hybrid --model <name>` use
sentence-transformers models from `requirements-ml.txt`. They are free and offline. Set
`HF_HOME=AI_Service/.hf-cache` to keep model files off the system drive.

### Paid API guard

Every eval that would call OpenAI (`run_eval --router openai|hybrid|llm`, `chat_eval`,
`retrieval_eval --model openai`) refuses to run unless `--allow-paid-api` is passed. Unit tests never call it:
they use scripted fake models.

## Run

API key: put it in the **repo-root `.env`** (gitignored). Docker Compose and local runs both read it.

```env
OPENAI_API_KEY=sk-...
```

```bash
# local (Windows)
py -3.13 -m venv .venv && .venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest                      # offline; pgvector test runs if PGVECTOR_TEST_URL is set
.venv/Scripts/python -m eval.run_eval --router all-offline           # free
.venv/Scripts/python -m eval.retrieval_eval --retriever bm25         # free
.venv/Scripts/python -m eval.run_eval --router all --allow-paid-api  # OpenAI embedding / hybrid / LLM: costs money
.venv/Scripts/python -m eval.chat_eval --allow-paid-api              # costs money

# full stack, from the repo root
docker compose up -d --build
```

Without a key, the service still runs: triage uses BM25 with the red-flag rules, `/v1/chat` returns 503, and
Spring answers in degraded mode with a specialty suggestion.

| Env var | Default | |
|---|---|---|
| `OPENAI_API_KEY` | (empty) | enables embeddings + chat |
| `AI_INTERNAL_TOKEN` | (required) | shared with Spring; requests are rejected if unset |
| `CHAT_MODEL` / `EMBEDDING_MODEL` | `gpt-4.1-mini` / `text-embedding-3-small` | |
| `DATABASE_URL` | (empty) means in-memory store | pgvector connection string |
| `REFUSAL_THRESHOLD`, `BM25_REFUSAL_THRESHOLD` | from the dev sweep | |
| `RERANKER_MODEL` / `RERANK_CANDIDATES` | (empty = off) / `20` | local cross-encoder over the top hybrid candidates; needs `requirements-ml.txt` |
