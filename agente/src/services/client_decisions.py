import requests

from src.constantes.constantes_filtro import (
    DECISIONS_TIMEOUT,
    DECISIONS_URL,
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

    def inventory_score(self, message: str) -> float:
        """Probabilidad (0 a 1) de que el mensaje sea una instrucción para gestionar el inventario."""
        res = requests.post(
            self._url,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"model": self._model, "state": message, "questions": {QUESTION_NAME: QUESTION}},
            timeout=DECISIONS_TIMEOUT,
        )
        res.raise_for_status()
        try:
            return float(res.json()["answers"][QUESTION_NAME]["noul"])
        except (KeyError, TypeError, ValueError) as error:
            raise DecisionsError("Respuesta inesperada de la API de decisions") from error
