from src.decorators.decorator_dto_validator import DtoValidator
from src.dtos.dto_search_query import SearchQueryDto
from src.decorators.decorator_tool_registry import ToolRegistry
from src.services.search_inventory import InventorySearch


@ToolRegistry.register
class SearchToolkit:
    """Tools de búsqueda aproximada sobre el inventario."""

    def __init__(self, search: InventorySearch) -> None:
        self._search = search

    @DtoValidator.tool(SearchQueryDto)
    def buscar(self, q: str) -> list[dict] | str:
        """Busca artículos y categorías por coincidencia aproximada con la consulta."""
        return self._search.articles_and_categories(q)

    @DtoValidator.tool(SearchQueryDto)
    def buscar_notas(self, q: str) -> list[dict] | str:
        """Busca notas de todos los artículos por coincidencia aproximada con la consulta."""
        return self._search.notes(q)
