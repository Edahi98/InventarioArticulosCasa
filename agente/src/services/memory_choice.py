import threading
import time
from collections.abc import Callable

from src.constantes.constantes_agente import CHOICE_FOLLOWUP, CHOICE_TARGETS, CHOICE_TTL_SECONDS


class ChoiceMemory:
    """
    Guarda por persona las opciones que se le mostraron cuando un nombre coincidió con varios registros, junto con
    el mensaje original, para retomar la petición con la opción elegida. Solo en memoria y con caducidad.
    """

    def __init__(
        self, ttl: int = CHOICE_TTL_SECONDS, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self._ttl = ttl
        self._clock = clock
        self._offers: dict[str, tuple[str, str, list[dict], float]] = {}
        self._lock = threading.Lock()

    def offer(self, key: str, message: str, resource: str, options: list[dict]) -> None:
        with self._lock:
            self._offers[key] = (message, resource, options, self._clock() + self._ttl)

    def options(self, key: str) -> list[dict] | None:
        """Las opciones vigentes de esa persona o None si no hay o ya caducaron."""
        with self._lock:
            offer = self._current(key)
            return None if offer is None else offer[2]

    def pick(self, key: str, index: int) -> str | None:
        """
        Consume la oferta y devuelve el mensaje original con la opción `index` elegida; None si no hay oferta
        vigente o el índice no existe.
        """
        with self._lock:
            offer = self._current(key)
            if offer is None or not 0 <= index < len(offer[2]):
                return None
            del self._offers[key]
        message, resource, options, _ = offer
        noun, param = CHOICE_TARGETS[resource]
        chosen = options[index]
        detail = f" (categoría {chosen['detail']})" if chosen.get("detail") else ""
        return CHOICE_FOLLOWUP.format(
            message=message, noun=noun, name=chosen["name"], detail=detail, param=param, id=chosen["id"]
        )

    def clear(self, key: str) -> None:
        with self._lock:
            self._offers.pop(key, None)

    def _current(self, key: str) -> tuple[str, str, list[dict], float] | None:
        offer = self._offers.get(key)
        if offer is not None and offer[3] <= self._clock():
            del self._offers[key]
            return None
        return offer
