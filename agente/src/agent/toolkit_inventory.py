from src.decorators.decorator_dto_validator import DtoValidator
from src.dtos.dto_article_create import ArticleCreateDto
from src.dtos.dto_article_ref import ArticleRefDto
from src.dtos.dto_article_update import ArticleUpdateDto
from src.dtos.dto_categories_filter import CategoriesFilterDto
from src.dtos.dto_category_create import CategoryCreateDto
from src.dtos.dto_category_filter import CategoryFilterDto
from src.dtos.dto_category_ref import CategoryRefDto
from src.dtos.dto_category_update import CategoryUpdateDto
from src.dtos.dto_no_input import NoInputDto
from src.dtos.dto_note_create import NoteCreateDto
from src.dtos.dto_note_ref import NoteRefDto
from src.dtos.dto_note_update import NoteUpdateDto
from src.dtos.dto_notes_ref import NotesRefDto
from src.dtos.dto_repair_flag import RepairFlagDto
from src.dtos.dto_stock_subtract import StockSubtractDto
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

    @DtoValidator.tool(CategoriesFilterDto)
    @NameLookup.categories()
    def listar_articulos(self, category_ids: list[int] | None = None) -> list[dict] | str:
        """Lista artículos. Con category_names (una o varias categorías) filtra por ellas; sin nombres, todos."""
        return self._inventory.list_each(ARTICLES, "categoryId", category_ids)

    @DtoValidator.tool(CategoryFilterDto)
    @NameLookup.category(optional=True)
    def listar_nombres_articulos(self, category_id: int | None = None) -> list[str] | str:
        """Lista solo los nombres de los artículos (sin fichas ni más datos); category_name filtra por categoría."""
        return self._inventory.names(ARTICLES, categoryId=category_id)

    @DtoValidator.tool(NoInputDto)
    def listar_nombres_categorias(self) -> list[str] | str:
        """Lista solo los nombres de las categorías (sin fichas ni más datos)."""
        return self._inventory.names(CATEGORIES)

    @DtoValidator.tool(CategoryFilterDto)
    @NameLookup.category(optional=True)
    def contar_articulos(self, category_id: int | None = None) -> dict | str:
        """Cuenta los artículos de una categoría (category_name) o, sin nombre, de todas las categorías."""
        return self._inventory.count_articles(categoryId=category_id)

    @DtoValidator.tool(ArticleRefDto)
    @NameLookup.article()
    def obtener_articulo(self, article_id: int) -> dict | str:
        """Obtiene un artículo por nombre aproximado."""
        return self._inventory.get(ARTICLES, article_id)

    @DtoValidator.tool(ArticleCreateDto)
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

    @DtoValidator.tool(ArticleUpdateDto)
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

    @DtoValidator.tool(ArticleRefDto)
    @NameLookup.article()
    def categoria_de_articulo(self, article_id: int) -> dict | str:
        """Dice a qué categoría pertenece un artículo."""
        return self._inventory.category_of(article_id)

    @DtoValidator.tool(ArticleRefDto)
    @NameLookup.article()
    def contar_stock(self, article_id: int) -> dict | str:
        """Cuenta cuántas unidades (stock) hay de un artículo."""
        return self._inventory.stock(article_id)

    @DtoValidator.tool(StockSubtractDto)
    @NameLookup.article()
    def restar_stock(self, article_id: int, amount: int = 1) -> dict | str:
        """Resta unidades al stock de un artículo (una por defecto) solo si le queda al menos una."""
        return self._inventory.subtract_stock(article_id, amount)

    @DtoValidator.tool(RepairFlagDto)
    @NameLookup.article()
    def marcar_reparacion(self, article_id: int, needs_repair: bool) -> dict | str:
        """Marca o desmarca un artículo como 'necesita reparación'."""
        return self._inventory.update(ARTICLES, article_id, needsRepair=needs_repair)

    @DtoValidator.tool(ArticleRefDto)
    @NameLookup.article()
    def eliminar_articulo(self, article_id: int) -> str:
        """Elimina un artículo por nombre aproximado."""
        return f"Artículo '{self._inventory.delete(ARTICLES, article_id)['name']}' eliminado."

    @DtoValidator.tool(NoInputDto)
    def listar_categorias(self) -> list[dict] | str:
        """Lista todas las categorías del inventario."""
        return self._inventory.list(CATEGORIES)

    @DtoValidator.tool(CategoryRefDto)
    @NameLookup.category()
    def obtener_categoria(self, category_id: int) -> dict | str:
        """Obtiene una categoría por nombre aproximado."""
        return self._inventory.get(CATEGORIES, category_id)

    @DtoValidator.tool(CategoryCreateDto)
    def crear_categoria(self, name: str, description: str = "", image_url: str = "") -> dict | str:
        """Crea una nueva categoría."""
        return self._inventory.create(CATEGORIES, name=name, description=description, imageUrl=image_url)

    @DtoValidator.tool(CategoryUpdateDto)
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

    @DtoValidator.tool(CategoryRefDto)
    @NameLookup.category()
    def eliminar_categoria(self, category_id: int) -> str:
        """Elimina una categoría por nombre aproximado."""
        return f"Categoría '{self._inventory.delete(CATEGORIES, category_id)['name']}' eliminada."

    @DtoValidator.tool(ArticleRefDto)
    @NameLookup.article()
    def listar_notas(self, article_id: int) -> list[dict] | str:
        """Lista todas las notas de un artículo."""
        return self._inventory.list(NOTES, articleId=article_id)

    @DtoValidator.tool(NoteCreateDto)
    @NameLookup.article()
    def crear_nota(self, article_id: int, title: str, description: str = "") -> dict | str:
        """Crea una nota asociada a un artículo."""
        return self._inventory.create(NOTES, articleId=article_id, title=title, description=description)

    @DtoValidator.tool(NoteUpdateDto)
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

    @DtoValidator.tool(NoteRefDto)
    @NameLookup.article()
    @NameLookup.note()
    def eliminar_nota(self, article_id: int, note_id: int) -> str:
        """Elimina una nota de un artículo identificándola por título aproximado."""
        return f"Nota '{self._inventory.delete(NOTES, note_id)['title']}' eliminada."

    @DtoValidator.tool(NotesRefDto)
    @NameLookup.article()
    @NameLookup.notes()
    def eliminar_notas(self, article_id: int, note_ids: list[int]) -> str:
        """Elimina varias notas de un artículo de una vez, dando los títulos aproximados en note_titles."""
        titles = [note["title"] for note in self._inventory.delete_many(NOTES, note_ids)]
        return f"Notas eliminadas ({len(titles)}): " + ", ".join(f"'{title}'" for title in titles) + "."
