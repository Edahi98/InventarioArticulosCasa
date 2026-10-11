from src.services.search_fuzzy import FuzzySearch
from src.services.client_inventory import InventoryClient


class NameResolver:
    """Resuelve el nombre aproximado que da el usuario al id del registro del inventario."""

    def __init__(self, inventory: InventoryClient, search: FuzzySearch) -> None:
        self._inventory = inventory
        self._search = search

    def resolve(self, resource: str, query: str, empty: str, **scope) -> int:
        """Id del registro de `resource` (filtrado por `scope`) más parecido a `query`."""
        items = self._inventory.list(resource, **scope)
        if not items:
            raise ValueError(empty)
        return self._search.best(query, items)["id"]
