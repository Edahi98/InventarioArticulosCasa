from src.backend import Backend
from src.constantes.constantes_checklist import STATUS_HAVE, STATUS_MISSING, STATUS_REVIEW
from src.constantes.constantes_red import MATCH_PATH


class ChecklistReview:
    """Compara una lista de cosas con el inventario (`POST /match`) y dice cuáles están, cuáles revisar y cuáles faltan."""

    def __init__(self, api: Backend) -> None:
        self._api = api

    def review(self, items: list[str]) -> dict:
        """Estado de cada cosa (`tengo`, `revisar` si está agotada o rota, `falta`) y el conteo por estado."""
        found = self._api.post(MATCH_PATH, {"terms": items})
        entries = [self._entry(row) for row in found]
        return {
            "resumen": {
                status: sum(1 for entry in entries if entry["estado"] == status)
                for status in (STATUS_HAVE, STATUS_REVIEW, STATUS_MISSING)
            },
            "cosas": entries,
        }

    @classmethod
    def _entry(cls, row: dict) -> dict:
        best = next(iter(row["matches"]), None)
        return {"cosa": row["term"], "estado": cls._status(best), **cls._detail(best)}

    @staticmethod
    def _status(best: dict | None) -> str:
        if best is None:
            return STATUS_MISSING
        return STATUS_REVIEW if best["stock"] <= 0 or best["needsRepair"] else STATUS_HAVE

    @staticmethod
    def _detail(best: dict | None) -> dict:
        if best is None:
            return {}
        return {
            "articulo": best["name"],
            "categoria": best["categoryName"],
            "ubicacion": best["location"],
            "stock": best["stock"],
            "necesita_reparacion": best["needsRepair"],
        }
