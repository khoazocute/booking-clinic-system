"""Local embedding models (free, offline) for the model comparisons. Not used at runtime.

Install the extra dependencies first: ``pip install -r requirements-ml.txt``. Model files are
cached under HF_HOME (use AI_Service/.hf-cache to keep them off the system drive).
E5 models expect "passage: " for documents and "query: " for queries.
"""


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name, device="cpu")
        self._e5 = "e5" in model_name.lower()
        self.model_id = f"st/{model_name}"

    def _encode(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts, normalize_embeddings=True, batch_size=32).tolist()

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Documents / passages."""
        return self._encode([f"passage: {t}" for t in texts] if self._e5 else texts)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([f"query: {text}" if self._e5 else text])[0]
