from dataclasses import asdict
from langchain_core.tools import tool
from ...application.services.category_service import CategoryService
from ...application.services.search_service import SearchService
from ...infrastructure.http.base_client import BackendError


def _str(v) -> str | None:
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    return v


def build_category_tools(service: CategoryService, search: SearchService) -> list:
    @tool
    def listar_categorias() -> list[dict] | str:
        """Lista todas las categorías del inventario."""
        try:
            return [asdict(c) for c in service.list_all()]
        except BackendError as e:
            return str(e)

    @tool
    def obtener_categoria(category_name: str) -> dict | str:
        """Obtiene una categoría por nombre aproximado."""
        try:
            cat_id = search.resolve_category_id(category_name)
            return asdict(service.get_by_id(cat_id))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def crear_categoria(name: str, description: str = "", image_url: str = "") -> dict | str:
        """Crea una nueva categoría."""
        try:
            return asdict(service.create(name, description, image_url))
        except BackendError as e:
            return str(e)

    @tool
    def actualizar_categoria(
        category_name: str,
        name: str | None = None,
        description: str | None = None,
        image_url: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de una categoría. Los campos omitidos conservan su valor actual."""
        try:
            cat_id = search.resolve_category_id(category_name)
            current = asdict(service.get_by_id(cat_id))
            return asdict(service.update(
                cat_id,
                _str(name) or current["name"],
                _str(description) if _str(description) is not None else current["description"],
                _str(image_url) if _str(image_url) is not None else current["imageUrl"],
            ))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def eliminar_categoria(category_name: str) -> str:
        """Elimina una categoría por nombre aproximado."""
        try:
            cat_id = search.resolve_category_id(category_name)
            service.delete(cat_id)
            return f"Categoría '{category_name}' eliminada."
        except (BackendError, ValueError) as e:
            return str(e)

    return [listar_categorias, obtener_categoria, crear_categoria, actualizar_categoria, eliminar_categoria]
