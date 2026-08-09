from ...domain.entities import Category, NewCategory
from ...domain.ports import ICategoryRepo
from .base_client import BaseHttpClient


def _parse(raw: dict) -> Category:
    return Category(
        id=raw["id"],
        name=raw["name"],
        description=raw.get("description", ""),
        imageUrl=raw.get("imageUrl", ""),
    )


class CategoryHttpClient(ICategoryRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def list_all(self) -> list[Category]:
        return [_parse(r) for r in self._client.get("/categories")]

    def get_by_id(self, id: int) -> Category:
        return _parse(self._client.get(f"/categories/{id}"))

    def create(self, data: NewCategory) -> Category:
        return _parse(self._client.post("/categories", {
            "name": data.name,
            "description": data.description,
            "imageUrl": data.imageUrl,
        }))

    def update(self, id: int, data: NewCategory) -> Category:
        return _parse(self._client.put(f"/categories/{id}", {
            "name": data.name,
            "description": data.description,
            "imageUrl": data.imageUrl,
        }))

    def delete(self, id: int) -> None:
        self._client.delete(f"/categories/{id}")
