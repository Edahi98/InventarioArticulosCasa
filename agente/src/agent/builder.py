from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent

from ..application.services.article_service import ArticleService
from ..application.services.category_service import CategoryService
from ..application.services.image_service import ImageService
from ..application.services.note_service import NoteService
from ..application.services.search_service import SearchService
from .tools.article_tools import build_article_tools
from .tools.category_tools import build_category_tools
from .tools.image_tools import build_image_tools
from .tools.note_tools import build_note_tools
from .tools.search_tools import build_search_tools


def build_agent(
    article_service: ArticleService,
    category_service: CategoryService,
    note_service: NoteService,
    search_service: SearchService,
    image_service: ImageService,
    ollama_url: str,
    ollama_model: str,
):
    tools = [
        *build_article_tools(article_service, search_service),
        *build_category_tools(category_service, search_service),
        *build_note_tools(note_service, search_service),
        *build_search_tools(search_service),
        *build_image_tools(image_service),
    ]

    system_prompt = (
        "Eres un asistente de gestión de inventario doméstico. "
        "Usa las herramientas disponibles para cualquier acción sobre artículos, categorías y notas. "
        "Cuando el mensaje contenga una URL de imagen, SIEMPRE pásala como image_url "
        "en crear_articulo, actualizar_articulo, crear_categoria o actualizar_categoria. "
        "Nunca omitas image_url si hay una URL en el contexto. "
        "Responde en español."
    )

    llm = ChatOllama(model=ollama_model, base_url=ollama_url)
    return create_react_agent(llm, tools, prompt=system_prompt)
