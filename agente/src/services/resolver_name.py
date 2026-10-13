import re

from src.constantes.constantes_agente import ID_REFERENCE, NOT_FOUND
from src.errors.error_ambiguo import AmbiguousName
from src.services.search_fuzzy import FuzzySearch
from src.services.client_inventory import InventoryClient


class NameResolver:
    """
    Resuelve el nombre aproximado que da el usuario al id del registro del inventario. Si el nombre coincide con
    varios registros lanza AmbiguousName para que la persona elija; "id:N" apunta directo a un registro.
    """

    def __init__(self, inventory: InventoryClient, search: FuzzySearch) -> None:
        self._inventory = inventory
        self._search = search

    def resolve(self, resource: str, query: str, empty: str, **scope) -> int:
        """Id del registro de `resource` (filtrado por `scope`) al que se refiere `query`."""
        items = self._inventory.list(resource, **scope)
        if not items:
            raise ValueError(empty)
        reference = re.fullmatch(ID_REFERENCE, query.strip())
        if reference:
            return self._by_id(items, int(reference.group(1)))
        matches = self._search.close(query, items)
        if len(matches) > 1:
            raise AmbiguousName(resource, [self._option(item) for item in matches])
        return matches[0]["id"]

    @staticmethod
    def _by_id(items: list[dict], record_id: int) -> int:
        if not any(item["id"] == record_id for item in items):
            raise ValueError(NOT_FOUND)
        return record_id

    @staticmethod
    def _option(item: dict) -> dict:
        return {"id": item["id"], "name": item.get("name") or item.get("title", ""), "detail": item.get("categoryName") or ""}
