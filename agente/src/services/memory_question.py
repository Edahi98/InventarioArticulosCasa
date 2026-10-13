import threading
import time
from collections.abc import Callable

from src.constantes.constantes_filtro import QUESTION_TTL_SECONDS


class QuestionMemory:
    """
    Guarda por persona la última pregunta que le hizo el asistente, para que su respuesta corta ("la bicicleta")
    se evalúe y se entienda en ese contexto. Solo en memoria y con caducidad.
    """

    def __init__(
        self, ttl: int = QUESTION_TTL_SECONDS, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self._ttl = ttl
        self._clock = clock
        self._pending: dict[str, tuple[str, float]] = {}
        self._lock = threading.Lock()

    def remember(self, key: str, question: str) -> None:
        with self._lock:
            self._pending[key] = (question, self._clock() + self._ttl)

    def pending(self, key: str) -> str | None:
        """La pregunta vigente de esa persona o None si no hay o ya caducó."""
        with self._lock:
            question, expires = self._pending.get(key, (None, 0.0))
            if question is not None and expires <= self._clock():
                del self._pending[key]
                return None
            return question

    def clear(self, key: str) -> None:
        with self._lock:
            self._pending.pop(key, None)
