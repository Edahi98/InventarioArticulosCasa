from ...domain.entities import Article, NewArticle
from ...domain.ports import IArticleRepo


class ArticleService:
    def __init__(self, repo: IArticleRepo) -> None:
        self._repo = repo

    def list_all(self, category_id: int | None = None) -> list[Article]:
        return self._repo.list_all(category_id)

    def get_by_id(self, id: int) -> Article:
        return self._repo.get_by_id(id)

    def create(
        self,
        name: str,
        category_id: int,
        stock: int = 0,
        description: str = "",
        image_url: str = "",
        needs_repair: bool = False,
    ) -> Article:
        return self._repo.create(NewArticle(
            name=name,
            categoryId=category_id,
            stock=stock,
            description=description,
            imageUrl=image_url,
            needsRepair=needs_repair,
        ))

    def update(
        self,
        id: int,
        name: str,
        category_id: int,
        stock: int = 0,
        description: str = "",
        image_url: str = "",
        needs_repair: bool = False,
    ) -> Article:
        return self._repo.update(id, NewArticle(
            name=name,
            categoryId=category_id,
            stock=stock,
            description=description,
            imageUrl=image_url,
            needsRepair=needs_repair,
        ))

    def delete(self, id: int) -> None:
        self._repo.delete(id)
