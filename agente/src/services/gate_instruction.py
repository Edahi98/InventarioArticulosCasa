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
from src.constantes.constantes_estado import NS_GATE
from src.errors.error_filtro import DecisionsError, InstructionRejected
from src.services.client_decisions import DecisionsClient
from src.services.memory_question import QuestionMemory

logger = logging.getLogger(__name__)


class InstructionGate:
    """
    Filtro previo al agente: pregunta a la API de decisions si el mensaje es para gestionar el inventario.
    Si no lo es, la persona queda en espera dos minutos y el mensaje nunca llega al agente.
    """

    def __init__(
        self,
        decisions: DecisionsClient,
        questions: QuestionMemory,
        store,
        cooldown: int = COOLDOWN_SECONDS,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._decisions = decisions
        self._questions = questions
        self._store = store
        self._cooldown = cooldown
        self._clock = clock

    def review(self, key: str, message: str) -> None:
        """
        Deja pasar el mensaje o lanza InstructionRejected (espera activa, no es de inventario o sin verificar).
        Si el asistente le acababa de preguntar algo a la persona, el mensaje se evalúa como su respuesta.
        """
        self._check_cooldown(key)
        score = self._score(message, self._questions.pending(key))
        if score >= INVENTORY_THRESHOLD:
            return
        self._store.put(NS_GATE, key, self._clock() + self._cooldown, self._cooldown)
        logger.info("Mensaje fuera del inventario (puntaje=%.2f); espera de %ss", score, self._cooldown)
        raise InstructionRejected(NOT_INVENTORY, STATUS_REJECTED)

    def _check_cooldown(self, key: str) -> None:
        blocked_until = self._store.get(NS_GATE, key)
        if blocked_until is None:
            return
        remaining = blocked_until - self._clock()
        if remaining <= 0:
            self._store.delete(NS_GATE, key)
            return
        raise InstructionRejected(COOLDOWN_ACTIVE.format(seconds=math.ceil(remaining)), STATUS_COOLDOWN)

    def _score(self, message: str, pending: str | None) -> float:
        try:
            return self._decisions.inventory_score(message, pending)
        except (requests.RequestException, DecisionsError):
            logger.exception("No se pudo consultar la API de decisions")
            raise InstructionRejected(UNVERIFIED, STATUS_UNVERIFIED) from None
