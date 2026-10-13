import threading
import time
from collections.abc import Callable

from src.constantes.constantes_agente import FOCUS_FRAME, FOCUS_MAX_ITEMS, FOCUS_TTL_SECONDS
from src.utilerias.util_registro import Records


class FocusMemory:
    """
    Recuerda por persona el artículo o la categoría de los que se habló en el último mensaje y los antepone al
    siguiente, para que "ese", "cámbiale el stock" o "elimínala" sepan a cuál se refieren. Solo en memoria.
    """

    def __init__(
        self, ttl: int = FOCUS_TTL_SECONDS, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self._ttl = ttl
        self._clock = clock
        self._focus: dict[str, tuple[str, float]] = {}
        self._lock = threading.Lock()

    def frame(self, key: str, message: str) -> str:
        """El mensaje precedido del contexto vigente de esa persona; sin contexto retorna el mensaje igual."""
        subjects = self._current(key)
        if subjects is None:
            return message
        return f"{FOCUS_FRAME.format(subjects=subjects)}\n{message}"

    def remember(self, key: str, results: list) -> None:
        """Guarda los artículos y categorías de los resultados de las tools; si no hay ninguno, conserva lo anterior."""
        records = Records.unique(Records.flatten(results))
        subjects = [self._describe(r) for r in records if Records.is_article(r) or Records.is_category(r)]
        if not subjects:
            return
        with self._lock:
            self._focus[key] = ("; ".join(subjects[-FOCUS_MAX_ITEMS:]), self._clock() + self._ttl)

    def forget(self, key: str) -> None:
        with self._lock:
            self._focus.pop(key, None)

    def _current(self, key: str) -> str | None:
        with self._lock:
            subjects, expires = self._focus.get(key, (None, 0.0))
            if subjects is not None and expires <= self._clock():
                del self._focus[key]
                return None
            return subjects

    @staticmethod
    def _describe(record: dict) -> str:
        if Records.is_category(record):
            return f'categoría "{record["name"]}" (id {record["id"]})'
        category = f", categoría {record['categoryName']}" if record.get("categoryName") else ""
        return f'artículo "{record.get("name", "")}" (id {record.get("id")}{category})'
