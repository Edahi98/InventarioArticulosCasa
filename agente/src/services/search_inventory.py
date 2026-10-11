from src.constantes.constantes_agente import ARTICLES, CATEGORIES, NOTES
from src.services.search_fuzzy import FuzzySearch
from src.services.client_inventory import InventoryClient


class InventorySearch:
    """Búsqueda aproximada sobre los registros del inventario."""

    def __init__(self, inventory: InventoryClient, search: FuzzySearch) -> None:
        self._inventory = inventory
        self._search = search

    def articles_and_categories(self, query: str) -> list[dict]:
        return (self._search.top(query, self._inventory.list(ARTICLES))
                + self._search.top(query, self._inventory.list(CATEGORIES)))

    def notes(self, query: str) -> list[dict]:
        return self._search.top(query, self._inventory.list(NOTES))
