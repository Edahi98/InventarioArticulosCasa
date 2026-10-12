import logging
import math
import time
from collections.abc import Callable

import requests

from src.constantes.constantes_filtro import (
    COOLDOWN_ACTIVE,
    COOLDOWN_SECONDS,
    INVENTORY_THRESHOLD,
    NOT_INVENTORY,
    STATUS_COOLDOWN,
    STATUS_REJECTED,
    STATUS_UNVERIFIED,
    UNVERIFIED,
)
from src.errors.error_filtro import DecisionsError, InstructionRejected
from src.services.client_decisions import DecisionsClient

logger = logging.getLogger(__name__)


class InstructionGate:
    """
    Filtro previo al agente: pregunta a la API de decisions si el mensaje es para gestionar el inventario.
    Si no lo es, la persona queda en espera dos minutos y el mensaje nunca llega al agente.
    """

    def __init__(
        self,
        decisions: DecisionsClient,
        cooldown: int = COOLDOWN_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._decisions = decisions
        self._cooldown = cooldown
        self._clock = clock
        self._blocked_until: dict[str, float] = {}

    def review(self, key: str, message: str) -> None:
        """Deja pasar el mensaje o lanza InstructionRejected (espera activa, no es de inventario o sin verificar)."""
        self._check_cooldown(key)
        score = self._score(message)
        if score >= INVENTORY_THRESHOLD:
            return
        self._blocked_until[key] = self._clock() + self._cooldown
        logger.info("Mensaje fuera del inventario (puntaje=%.2f); espera de %ss", score, self._cooldown)
        raise InstructionRejected(NOT_INVENTORY, STATUS_REJECTED)

    def _check_cooldown(self, key: str) -> None:
        remaining = self._blocked_until.get(key, 0.0) - self._clock()
        if remaining <= 0:
            self._blocked_until.pop(key, None)
            return
        raise InstructionRejected(COOLDOWN_ACTIVE.format(seconds=math.ceil(remaining)), STATUS_COOLDOWN)

    def _score(self, message: str) -> float:
        try:
            return self._decisions.inventory_score(message)
        except (requests.RequestException, DecisionsError):
            logger.exception("No se pudo consultar la API de decisions")
            raise InstructionRejected(UNVERIFIED, STATUS_UNVERIFIED) from None
