from dataclasses import asdict
from langchain_core.tools import tool
from ...application.services.search_service import SearchService


def build_search_tools(service: SearchService) -> list:
    @tool
    def buscar(q: str) -> list[dict] | str:
        """Busca artículos y categorías por similitud semántica con la consulta."""
        try:
            articles = [asdict(a) for a in service.search_articles(q)]
            cats = [asdict(c) for c in service.search_categories(q)]
            return articles + cats
        except Exception as e:
            return str(e)

    return [buscar]
