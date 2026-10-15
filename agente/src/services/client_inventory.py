from __future__ import annotations

from src.backend import Backend
from src.constantes.constantes_agente import ARTICLES, RESOURCE_FIELDS
from src.utilerias.util_valor import Valor


class InventoryClient:
    """Operaciones CRUD sobre los recursos del inventario (`articles`, `categories`, `notes`) del backend."""

    def __init__(self, api: Backend) -> None:
        self._api = api

    def list(self, resource: str, **params) -> list[dict]:
        return self._api.get(f"/{resource}", params=params or None)

    def list_each(self, resource: str, key: str, values: list | None) -> list[dict]:
        """Une el listado de cada valor de `key` sin repetir registros; sin valores, lista todo."""
        if not values:
            return self.list(resource)
        found = [record for value in values for record in self.list(resource, **{key: value})]
        return list({record["id"]: record for record in found}.values())

    def names(self, resource: str, **params) -> list[str]:
        """Solo los nombres de los registros de `resource`, sin sus demás datos."""
        return [record["name"] for record in self.list(resource, **params)]

    def count_articles(self, **params) -> dict:
        """Conteo de artículos por categoría (`categoryId` opcional) que calcula el backend."""
        return self._api.get(f"/{ARTICLES}/count", params=params or None)

    def get(self, resource: str, record_id: int) -> dict:
        return self._api.get(f"/{resource}/{record_id}")

    def create(self, resource: str, **data) -> dict:
        return self._complete(resource, self._api.post(f"/{resource}", data))

    def update(self, resource: str, record_id: int, **changes) -> dict:
        """PUT con los valores actuales, reemplazando solo los campos que llegaron con valor."""
        current = self.get(resource, record_id)
        payload = {f: changes[f] if Valor.given(changes.get(f)) else current[f] for f in RESOURCE_FIELDS[resource]}
        return self._complete(resource, self._api.put(f"/{resource}/{record_id}", payload))

    def stock(self, article_id: int) -> dict:
        """Nombre y unidades (stock) de un artículo."""
        article = self.get(ARTICLES, article_id)
        return {"name": article["name"], "stock": article["stock"]}

    def subtract_stock(self, article_id: int, amount: int) -> dict:
        """
        Resta `amount` unidades solo si después queda al menos una; si no, no cambia nada y lo informa
        (`subtracted` False) para que quien llama decida, por ejemplo eliminar el artículo.
        """
        article = self.get(ARTICLES, article_id)
        before = article["stock"]
        subtracted = before > amount
        after = self.update(ARTICLES, article_id, stock=before - amount)["stock"] if subtracted else before
        return {"name": article["name"], "stock_before": before, "stock_after": after, "subtracted": subtracted}

    def delete(self, resource: str, record_id: int) -> dict:
        """Elimina el registro y devuelve el que se borró."""
        record = self.get(resource, record_id)
        self._api.delete(f"/{resource}/{record_id}")
        return record

    def delete_many(self, resource: str, record_ids: list[int]) -> list[dict]:
        """Elimina cada registro y devuelve los que se borraron."""
        return [self.delete(resource, record_id) for record_id in record_ids]

    def upload_image(self, data: bytes, filename: str) -> str:
        return self._api.upload_image(data, filename)

    def _complete(self, resource: str, record: dict) -> dict:
        """Los artículos que devuelven POST y PUT no traen `categoryName`; se relee para tenerlo completo."""
        return self.get(resource, record["id"]) if resource == ARTICLES else record
