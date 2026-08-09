from dataclasses import asdict
from langchain_core.tools import tool
from ...application.services.note_service import NoteService
from ...application.services.search_service import SearchService
from ...infrastructure.http.base_client import BackendError


def build_note_tools(service: NoteService, search: SearchService) -> list:
    @tool
    def listar_notas(article_name: str) -> list[dict] | str:
        """Lista todas las notas de un artículo."""
        try:
            art_id = search.resolve_article_id(article_name)
            return [asdict(n) for n in service.list_by_article(art_id)]
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def crear_nota(article_name: str, title: str, description: str = "") -> dict | str:
        """Crea una nota asociada a un artículo."""
        try:
            art_id = search.resolve_article_id(article_name)
            return asdict(service.create(title, art_id, description))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def actualizar_nota(
        article_name: str,
        note_title: str,
        title: str | None = None,
        description: str | None = None,
    ) -> dict | str:
        """Actualiza solo los campos indicados de una nota. Los campos omitidos conservan su valor actual."""
        try:
            art_id = search.resolve_article_id(article_name)
            note_id = search.resolve_note_id(art_id, note_title)
            current = asdict(service.get_by_id(note_id))
            return asdict(service.update(
                note_id,
                title if title is not None else current["title"],
                description if description is not None else current["description"],
            ))
        except (BackendError, ValueError) as e:
            return str(e)

    @tool
    def eliminar_nota(article_name: str, note_title: str) -> str:
        """Elimina una nota de un artículo identificándola por título aproximado."""
        try:
            art_id = search.resolve_article_id(article_name)
            note_id = search.resolve_note_id(art_id, note_title)
            service.delete(note_id)
            return f"Nota '{note_title}' eliminada."
        except (BackendError, ValueError) as e:
            return str(e)

    return [listar_notas, crear_nota, actualizar_nota, eliminar_nota]
