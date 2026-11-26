"""Vector stores: pgvector in production, in-memory for tests / when no DATABASE_URL is set.

Both store the content hash and the embedding model id with each vector, so re-indexing only
embeds documents whose text changed, and switching embedding model re-embeds everything.
"""

import json
from typing import Protocol

import numpy as np

from app.kb.documents import KnowledgeDoc


class VectorStore(Protocol):
    def existing_hashes(self, model_id: str) -> dict[str, str]: ...

    def upsert(self, docs: list[KnowledgeDoc], vectors: list[list[float]], model_id: str) -> None: ...

    def delete_except(self, keep_ids: set[str]) -> int: ...

    def all_docs(self) -> list[KnowledgeDoc]: ...

    def search(self, vector: list[float], k: int, model_id: str,
               source_types: list[str] | None = None) -> list[tuple[KnowledgeDoc, float]]: ...


class InMemoryVectorStore:
    def __init__(self):
        self._rows: dict[str, tuple[KnowledgeDoc, np.ndarray, str, str]] = {}  # id -> doc, unit vec, hash, model

    def existing_hashes(self, model_id: str) -> dict[str, str]:
        return {i: h for i, (_, _, h, m) in self._rows.items() if m == model_id}

    def upsert(self, docs, vectors, model_id):
        for doc, vec in zip(docs, vectors):
            v = np.asarray(vec, dtype=float)
            self._rows[doc.id] = (doc, v / (np.linalg.norm(v) or 1.0), doc.content_hash, model_id)

    def delete_except(self, keep_ids):
        removed = [i for i in self._rows if i not in keep_ids]
        for i in removed:
            del self._rows[i]
        return len(removed)

    def all_docs(self):
        return [doc for doc, *_ in self._rows.values()]

    def search(self, vector, k, model_id, source_types=None):
        q = np.asarray(vector, dtype=float)
        q = q / (np.linalg.norm(q) or 1.0)
        hits = [(doc, float(v @ q)) for doc, v, _, m in self._rows.values()
                if m == model_id and (not source_types or doc.source_type in source_types)]
        return sorted(hits, key=lambda h: h[1], reverse=True)[:k]


class PgVectorStore:
    """PostgreSQL + pgvector, cosine distance with an HNSW index."""

    TABLE = "kb_documents"

    def __init__(self, database_url: str):
        import psycopg
        from pgvector.psycopg import register_vector

        self._conn = psycopg.connect(database_url, autocommit=True)
        self._conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        register_vector(self._conn)
        self._dim: int | None = self._current_dim()

    def _current_dim(self) -> int | None:
        row = self._conn.execute(
            "SELECT atttypmod FROM pg_attribute WHERE attrelid = to_regclass(%s) AND attname = 'embedding'",
            (self.TABLE,)).fetchone()
        return row[0] if row and row[0] > 0 else None

    def _ensure_schema(self, dim: int) -> None:
        if self._dim == dim:
            return
        # new table, or the embedding model changed dimension: start over
        self._conn.execute(f"DROP TABLE IF EXISTS {self.TABLE}")
        self._conn.execute(f"""
            CREATE TABLE {self.TABLE} (
                id           TEXT PRIMARY KEY,
                source_type  TEXT NOT NULL,
                source_id    BIGINT,
                title        TEXT NOT NULL,
                content      TEXT NOT NULL,
                metadata     JSONB NOT NULL DEFAULT '{{}}',
                content_hash TEXT NOT NULL,
                model_id     TEXT NOT NULL,
                embedding    vector({dim}) NOT NULL,
                updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
            )""")
        self._conn.execute(f"CREATE INDEX ON {self.TABLE} USING hnsw (embedding vector_cosine_ops)")
        self._conn.execute(f"CREATE INDEX ON {self.TABLE} (source_type)")
        self._dim = dim

    def existing_hashes(self, model_id):
        if self._dim is None:
            return {}
        rows = self._conn.execute(f"SELECT id, content_hash FROM {self.TABLE} WHERE model_id = %s", (model_id,))
        return dict(rows.fetchall())

    def upsert(self, docs, vectors, model_id):
        if not docs:
            return
        self._ensure_schema(len(vectors[0]))
        with self._conn.cursor() as cur:
            cur.executemany(f"""
                INSERT INTO {self.TABLE} (id, source_type, source_id, title, content, metadata, content_hash, model_id, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET source_type = EXCLUDED.source_type, source_id = EXCLUDED.source_id,
                    title = EXCLUDED.title, content = EXCLUDED.content, metadata = EXCLUDED.metadata,
                    content_hash = EXCLUDED.content_hash, model_id = EXCLUDED.model_id,
                    embedding = EXCLUDED.embedding, updated_at = now()""",
                [(d.id, d.source_type, d.source_id, d.title, d.content, json.dumps(d.metadata), d.content_hash,
                  model_id, np.asarray(v, dtype=np.float32)) for d, v in zip(docs, vectors)])

    def delete_except(self, keep_ids):
        if self._dim is None:
            return 0
        return self._conn.execute(f"DELETE FROM {self.TABLE} WHERE NOT (id = ANY(%s))", (list(keep_ids),)).rowcount

    def all_docs(self):
        if self._dim is None:
            return []
        rows = self._conn.execute(f"SELECT id, source_type, source_id, title, content, metadata FROM {self.TABLE}")
        return [KnowledgeDoc(r[0], r[1], r[2], r[3], r[4], r[5] or {}) for r in rows.fetchall()]

    def search(self, vector, k, model_id, source_types=None):
        if self._dim is None:
            return []
        q = np.asarray(vector, dtype=np.float32)
        rows = self._conn.execute(f"""
            SELECT id, source_type, source_id, title, content, metadata, 1 - (embedding <=> %s) AS score
            FROM {self.TABLE}
            WHERE model_id = %s AND (%s::text[] IS NULL OR source_type = ANY(%s::text[]))
            ORDER BY embedding <=> %s
            LIMIT %s""", (q, model_id, source_types, source_types, q, k)).fetchall()
        return [(KnowledgeDoc(r[0], r[1], r[2], r[3], r[4], r[5] or {}), float(r[6])) for r in rows]
