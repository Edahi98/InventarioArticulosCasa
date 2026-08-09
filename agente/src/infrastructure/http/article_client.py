from ...domain.entities import Article, NewArticle
from ...domain.ports import IArticleRepo
from .base_client import BaseHttpClient


def _parse(raw: dict) -> Article:
    return Article(
        id=raw["id"],
        name=raw["name"],
        categoryId=raw["categoryId"],
        stock=raw.get("stock", 0),
        description=raw.get("description", ""),
        imageUrl=raw.get("imageUrl", ""),
        needsRepair=raw.get("needsRepair", False),
    )


class ArticleHttpClient(IArticleRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def list_all(self, category_id: int | None = None) -> list[Article]:
        params = {"categoryId": category_id} if category_id else {}
        return [_parse(r) for r in self._client.get("/articles", params=params)]

    def get_by_id(self, id: int) -> Article:
        return _parse(self._client.get(f"/articles/{id}"))

    def create(self, data: NewArticle) -> Article:
        return _parse(self._client.post("/articles", {
            "name": data.name,
            "categoryId": data.categoryId,
            "stock": data.stock,
            "description": data.description,
            "imageUrl": data.imageUrl,
            "needsRepair": data.needsRepair,
        }))

    def update(self, id: int, data: NewArticle) -> Article:
        return _parse(self._client.put(f"/articles/{id}", {
            "name": data.name,
            "categoryId": data.categoryId,
            "stock": data.stock,
            "description": data.description,
            "imageUrl": data.imageUrl,
            "needsRepair": data.needsRepair,
        }))

    def delete(self, id: int) -> None:
        self._client.delete(f"/articles/{id}")
