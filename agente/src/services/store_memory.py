import json
import threading
import time
from collections.abc import Callable


class StoreMemory:
    """
    Almacén clave-valor con caducidad en la memoria del proceso (CLI, servidor y bot de Telegram locales).
    Los valores son JSON, igual que en StorePostgres, para que ambos se comporten igual.
    """

    def __init__(self, clock: Callable[[], float] = time.time) -> None:
        self._clock = clock
        self._items: dict[tuple[str, str], tuple[str, float]] = {}
        self._lock = threading.Lock()

    def get(self, namespace: str, key: str):
        """El valor vigente o None si no existe o ya caducó."""
        with self._lock:
            raw, expires = self._items.get((namespace, key), (None, 0.0))
            if raw is not None and expires <= self._clock():
                del self._items[(namespace, key)]
                return None
            return None if raw is None else json.loads(raw)

    def put(self, namespace: str, key: str, value, ttl_seconds: float) -> None:
        with self._lock:
            self._items[(namespace, key)] = (json.dumps(value), self._clock() + ttl_seconds)

    def delete(self, namespace: str, key: str) -> None:
        with self._lock:
            self._items.pop((namespace, key), None)
