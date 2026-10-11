from src.decorators.decorator_name_lookup import NameLookup
from src.decorators.decorator_tool_registry import ToolRegistry
from src.constantes.constantes_agente import ARTICLES, CATEGORIES, NOTES
from src.services.search_fuzzy import FuzzySearch
from src.services.client_inventory import InventoryClient
from src.services.resolver_name import NameResolver


@ToolRegistry.register
class AgentToolkit:
    """Cada método público es una tool del agente; `tools()` (añadido por el decorador) las devuelve."""

    def __init__(self, inventory: InventoryClient, search: FuzzySearch) -> None:
        self._inventory = inventory
        self._resolver = NameResolver(inventory, search)

    @NameLookup.category(optional=True)
    def listar_articulos(self, category_id: int | None = None) -> list[dict] | str:
        """Lista artículos. Si se da category_name, filtra por esa categoría."""
        return self._inventory.list(ARTICLES, categoryId=category_id)

    @NameLookup.article()
    def obtener_articulo(self, article_id: int) -> dict | str:
        """Obtiene un artículo por nombre aproximado."""
        return self._inventory.get(ARTICLES, article_id)

    @NameLookup.category()
    def crear_articulo(
        self,
        name: str,
        category_id: int,
        stock: int = 0,
        description: str = "",
        image_url: str = "",
        needs_repair: bool = False,
    ) -> dict | str:
        """Crea un nuevo artículo. Usa el nombre de la categoría; el ID se resuelve automáticamente."""
        return self._inventory.create(ARTICLES, name=name, categoryId=category_id, stock=stock,
                                      description=description, imageUrl=image_url, needsRepair=needs_repair)

    @NameLookup.article()
    @NameLookup.category(optional=True)
    def actualizar_articulo(
        self,
        article_id: int,
        name: str | None = None,
        category_id: int | None = None,
        stock: int | None = None,
        description: str | None = None,
        image_url: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de un artículo. article_name identifica cuál actualizar."""
        return self._inventory.update(ARTICLES, article_id, name=name, categoryId=category_id,
                                      stock=stock, description=description, imageUrl=image_url)

    @NameLookup.article()
    def marcar_reparacion(self, article_id: int, needs_repair: bool) -> dict | str:
        """Marca o desmarca un artículo como 'necesita reparación'."""
        return self._inventory.update(ARTICLES, article_id, needsRepair=needs_repair)

    @NameLookup.article()
    def eliminar_articulo(self, article_id: int) -> str:
        """Elimina un artículo por nombre aproximado."""
        return f"Artículo '{self._inventory.delete(ARTICLES, article_id)['name']}' eliminado."

    def listar_categorias(self) -> list[dict] | str:
        """Lista todas las categorías del inventario."""
        return self._inventory.list(CATEGORIES)

    @NameLookup.category()
    def obtener_categoria(self, category_id: int) -> dict | str:
        """Obtiene una categoría por nombre aproximado."""
        return self._inventory.get(CATEGORIES, category_id)

    def crear_categoria(self, name: str, description: str = "", image_url: str = "") -> dict | str:
        """Crea una nueva categoría."""
        return self._inventory.create(CATEGORIES, name=name, description=description, imageUrl=image_url)

    @NameLookup.category()
    def actualizar_categoria(
        self,
        category_id: int,
        name: str | None = None,
        description: str | None = None,
        image_url: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de una categoría. Los campos omitidos conservan su valor actual."""
        return self._inventory.update(CATEGORIES, category_id, name=name, description=description, imageUrl=image_url)

    @NameLookup.category()
    def eliminar_categoria(self, category_id: int) -> str:
        """Elimina una categoría por nombre aproximado."""
        return f"Categoría '{self._inventory.delete(CATEGORIES, category_id)['name']}' eliminada."

    @NameLookup.article()
    def listar_notas(self, article_id: int) -> list[dict] | str:
        """Lista todas las notas de un artículo."""
        return self._inventory.list(NOTES, articleId=article_id)

    @NameLookup.article()
    def crear_nota(self, article_id: int, title: str, description: str = "") -> dict | str:
        """Crea una nota asociada a un artículo."""
        return self._inventory.create(NOTES, articleId=article_id, title=title, description=description)

    @NameLookup.article()
    @NameLookup.note()
    def actualizar_nota(
        self,
        article_id: int,
        note_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de una nota. Los campos omitidos conservan su valor actual."""
        return self._inventory.update(NOTES, note_id, title=title, description=description)

    @NameLookup.article()
    @NameLookup.note()
    def eliminar_nota(self, article_id: int, note_id: int) -> str:
        """Elimina una nota de un artículo identificándola por título aproximado."""
        return f"Nota '{self._inventory.delete(NOTES, note_id)['title']}' eliminada."
