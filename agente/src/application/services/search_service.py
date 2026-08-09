from ...domain.entities import Article, Category
from ...domain.ports import IArticleRepo, ICategoryRepo, INoteRepo
from ...infrastructure.search.semantic_search import find_best, find_top_k


class SearchService:
    def __init__(self, article_repo: IArticleRepo, category_repo: ICategoryRepo, note_repo: INoteRepo) -> None:
        self._articles = article_repo
        self._categories = category_repo
        self._notes = note_repo

    def resolve_category_id(self, name: str) -> int:
        cats = self._categories.list_all()
        if not cats:
            raise ValueError("No hay categorías disponibles.")
        docs = [f"{c.name} {c.description}" for c in cats]
        return cats[find_best(name, docs)].id

    def resolve_article_id(self, name: str) -> int:
        articles = self._articles.list_all()
        if not articles:
            raise ValueError("No hay artículos disponibles.")
        docs = [f"{a.name} {a.description}" for a in articles]
        return articles[find_best(name, docs)].id

    def resolve_note_id(self, article_id: int, note_title: str) -> int:
        notes = self._notes.list_by_article(article_id)
        if not notes:
            raise ValueError("No hay notas para ese artículo.")
        docs = [f"{n.title} {n.description}" for n in notes]
        return notes[find_best(note_title, docs)].id

    def search_articles(self, query: str, top_k: int = 5) -> list[Article]:
        articles = self._articles.list_all()
        if not articles:
            return []
        docs = [f"{a.name} {a.description}" for a in articles]
        return [articles[i] for i in find_top_k(query, docs, top_k)]

    def search_categories(self, query: str, top_k: int = 5) -> list[Category]:
        cats = self._categories.list_all()
        if not cats:
            return []
        docs = [f"{c.name} {c.description}" for c in cats]
        return [cats[i] for i in find_top_k(query, docs, top_k)]
