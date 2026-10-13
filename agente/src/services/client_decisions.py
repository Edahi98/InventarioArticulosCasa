import requests

from src.constantes.constantes_filtro import (
    ASKS,
    ASKS_NAME,
    DECISIONS_TIMEOUT,
    DECISIONS_URL,
    PENDING_STATE,
    QUESTION,
    QUESTION_NAME,
)
from src.errors.error_filtro import DecisionsError


class DecisionsClient:
    """Cliente de la API de decisions de OpenRouter (POST /api/alpha/decisions) con `requests`."""

    def __init__(self, api_key: str, model: str, url: str = DECISIONS_URL) -> None:
        self._api_key = api_key
        self._model = model
        self._url = url

    def inventory_score(self, message: str, pending: str | None = None) -> float:
        """
        Probabilidad (0 a 1) de que el mensaje sea una instrucción para gestionar el inventario. Si el asistente
        había hecho una pregunta (`pending`), el mensaje se evalúa como respuesta a ella.
        """
        state = PENDING_STATE.format(question=pending, message=message) if pending else message
        return self._score(state, QUESTION_NAME, QUESTION)

    def asks_score(self, reply: str) -> float:
        """Probabilidad (0 a 1) de que la respuesta del asistente le pida un dato o una confirmación a la persona."""
        return self._score(reply, ASKS_NAME, ASKS)

    def _score(self, state: str, name: str, question: dict) -> float:
        res = requests.post(
            self._url,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"model": self._model, "state": state, "questions": {name: question}},
            timeout=DECISIONS_TIMEOUT,
        )
        res.raise_for_status()
        try:
            return float(res.json()["answers"][name]["noul"])
        except (KeyError, TypeError, ValueError) as error:
            raise DecisionsError("Respuesta inesperada de la API de decisions") from error
