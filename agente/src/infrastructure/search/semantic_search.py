from __future__ import annotations
from sentence_transformers import SentenceTransformer

_MODEL_NAME = "MongoDB/mdbr-leaf-ir"
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def find_best(query: str, documents: list[str]) -> int:
    """Índice del documento más similar semánticamente al query."""
    if not documents:
        raise ValueError("Lista de documentos vacía.")
    model = _get_model()
    q_emb = model.encode([query], prompt_name="query")
    d_emb = model.encode(documents)
    scores = model.similarity(q_emb, d_emb)[0]
    return int(scores.argmax())


def find_top_k(query: str, documents: list[str], top_k: int = 5) -> list[int]:
    """Índices de los top_k documentos más similares."""
    if not documents:
        return []
    model = _get_model()
    q_emb = model.encode([query], prompt_name="query")
    d_emb = model.encode(documents)
    scores = model.similarity(q_emb, d_emb)[0]
    k = min(top_k, len(documents))
    return scores.topk(k).indices.tolist()
