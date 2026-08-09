from ...domain.entities import Category, NewCategory
from ...domain.ports import ICategoryRepo


class CategoryService:
    def __init__(self, repo: ICategoryRepo) -> None:
        self._repo = repo

    def list_all(self) -> list[Category]:
        return self._repo.list_all()

    def get_by_id(self, id: int) -> Category:
        return self._repo.get_by_id(id)

    def create(self, name: str, description: str = "", image_url: str = "") -> Category:
        return self._repo.create(NewCategory(name=name, description=description, imageUrl=image_url))

    def update(self, id: int, name: str, description: str = "", image_url: str = "") -> Category:
        return self._repo.update(id, NewCategory(name=name, description=description, imageUrl=image_url))

    def delete(self, id: int) -> None:
        self._repo.delete(id)
