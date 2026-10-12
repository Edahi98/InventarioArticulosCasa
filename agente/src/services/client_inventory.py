from src.backend import Backend
from src.constantes.constantes_agente import ARTICLES, RESOURCE_FIELDS
from src.utilerias.util_valor import Valor


class InventoryClient:
    """Operaciones CRUD sobre los recursos del inventario (`articles`, `categories`, `notes`) del backend."""

    def __init__(self, api: Backend) -> None:
        self._api = api

    def list(self, resource: str, **params) -> list[dict]:
        return self._api.get(f"/{resource}", params=params or None)

    def get(self, resource: str, record_id: int) -> dict:
        return self._api.get(f"/{resource}/{record_id}")

    def create(self, resource: str, **data) -> dict:
        return self._complete(resource, self._api.post(f"/{resource}", data))

    def update(self, resource: str, record_id: int, **changes) -> dict:
        """PUT con los valores actuales, reemplazando solo los campos que llegaron con valor."""
        current = self.get(resource, record_id)
        payload = {f: changes[f] if Valor.given(changes.get(f)) else current[f] for f in RESOURCE_FIELDS[resource]}
        return self._complete(resource, self._api.put(f"/{resource}/{record_id}", payload))

    def delete(self, resource: str, record_id: int) -> dict:
        """Elimina el registro y devuelve el que se borró."""
        record = self.get(resource, record_id)
        self._api.delete(f"/{resource}/{record_id}")
        return record

    def upload_image(self, data: bytes, filename: str) -> str:
        return self._api.upload_image(data, filename)

    def _complete(self, resource: str, record: dict) -> dict:
        """Los artículos que devuelven POST y PUT no traen `categoryName`; se relee para tenerlo completo."""
        return self.get(resource, record["id"]) if resource == ARTICLES else record
