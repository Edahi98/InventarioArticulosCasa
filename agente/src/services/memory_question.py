from src.constantes.constantes_estado import NS_QUESTION
from src.constantes.constantes_filtro import QUESTION_TTL_SECONDS


class QuestionMemory:
    """
    Guarda por persona la última pregunta que le hizo el asistente, para que su respuesta corta ("la bicicleta")
    se evalúe y se entienda en ese contexto. Vive en el almacén de estado (memoria o Postgres) con caducidad.
    """

    def __init__(self, store, ttl: int = QUESTION_TTL_SECONDS) -> None:
        self._store = store
        self._ttl = ttl

    def remember(self, key: str, question: str) -> None:
        self._store.put(NS_QUESTION, key, question, self._ttl)

    def pending(self, key: str) -> str | None:
        """La pregunta vigente de esa persona o None si no hay o ya caducó."""
        return self._store.get(NS_QUESTION, key)

    def clear(self, key: str) -> None:
        self._store.delete(NS_QUESTION, key)
