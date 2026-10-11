from rapidfuzz import fuzz, process, utils

from src.constantes.constantes_agente import SEARCH_MIN_SCORE, SEARCH_TOP_K
from src.utilerias.util_codec import Codec


class FuzzySearch:
    """Búsqueda aproximada (RapidFuzz) sobre dicts del backend, por name/title + description, sin tildes."""

    def best(self, query: str, items: list[dict]) -> dict:
        """El elemento más parecido al query."""
        _, _, index = process.extractOne(self._text(query), self._documents(items),
                                         scorer=fuzz.WRatio, processor=utils.default_process)
        return items[index]

    def top(self, query: str, items: list[dict], k: int = SEARCH_TOP_K) -> list[dict]:
        """Hasta k elementos que superan el puntaje mínimo, del más al menos parecido."""
        matches = process.extract(self._text(query), self._documents(items), scorer=fuzz.WRatio,
                                  processor=utils.default_process, limit=k, score_cutoff=SEARCH_MIN_SCORE)
        return [items[index] for _, _, index in matches]

    @classmethod
    def _documents(cls, items: list[dict]) -> list[str]:
        return [cls._text(f"{i.get('name') or i.get('title', '')} {i.get('description', '')}") for i in items]

    @staticmethod
    def _text(value: str) -> str:
        return Codec.strip_accents(value)
