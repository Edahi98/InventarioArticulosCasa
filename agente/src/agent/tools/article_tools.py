from dataclasses import asdict
from langchain_core.tools import tool
from ...application.services.article_service import ArticleService
from ...application.services.search_service import SearchService
from ...infrastructure.http.base_client import BackendError

_UNSET = object()


def _str(v) -> str | None:
    """Convierte string vacío a None."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    return v


def build_article_tools(service: ArticleService, search: SearchService) -> list:
    @tool
    def listar_articulos(category_name: str | None = None) -> list[dict] | str:
        """Lista artículos. Si se da category_name, filtra por esa categoría."""
        try:
            cat_id = search.resolve_category_id(category_name) if category_name else None
            return [asdict(a) for a in service.list_all(cat_id)]
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def obtener_articulo(article_name: str) -> dict | str:
        """Obtiene un artículo por nombre aproximado."""
        try:
            art_id = search.resolve_article_id(article_name)
            return asdict(service.get_by_id(art_id))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def crear_articulo(
        name: str,
        category_name: str,
        stock: int = 0,
        description: str = "",
        image_url: str = "",
        needs_repair: bool = False,
    ) -> dict | str:
        """Crea un nuevo artículo. Usa el nombre de la categoría; el ID se resuelve automáticamente."""
        try:
            category_id = search.resolve_category_id(category_name)
            return asdict(service.create(name, category_id, stock, description, image_url or "", needs_repair))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def actualizar_articulo(
        article_name: str,
        name: str | None = None,
        category_name: str | None = None,
        stock: int | None = None,
        description: str | None = None,
        image_url: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de un artículo. article_name identifica cuál actualizar."""
        try:
            art_id = search.resolve_article_id(article_name)
            cur = asdict(service.get_by_id(art_id))
            cat_id = (
                search.resolve_category_id(category_name)
                if _str(category_name) is not None
                else cur["categoryId"]
            )
            return asdict(service.update(
                art_id,
                _str(name) or cur["name"],
                cat_id,
                stock if stock is not None else cur["stock"],
                _str(description) if _str(description) is not None else cur["description"],
                _str(image_url) if _str(image_url) is not None else cur["imageUrl"],
                cur["needsRepair"],
            ))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def marcar_reparacion(article_name: str, needs_repair: bool) -> dict | str:
        """Marca o desmarca un artículo como 'necesita reparación'."""
        try:
            art_id = search.resolve_article_id(article_name)
            cur = asdict(service.get_by_id(art_id))
            return asdict(service.update(
                art_id,
                cur["name"], cur["categoryId"], cur["stock"],
                cur["description"], cur["imageUrl"], needs_repair,
            ))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def eliminar_articulo(article_name: str) -> str:
        """Elimina un artículo por nombre aproximado."""
        try:
            art_id = search.resolve_article_id(article_name)
            service.delete(art_id)
            return f"Artículo '{article_name}' eliminado."
        except (BackendError, ValueError) as e:
            return str(e)

    return [
        listar_articulos, obtener_articulo, crear_articulo,
        actualizar_articulo, marcar_reparacion, eliminar_articulo,
    ]
