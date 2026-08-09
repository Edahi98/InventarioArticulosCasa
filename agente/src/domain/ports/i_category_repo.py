from abc import ABC, abstractmethod
from ..entities import Category, NewCategory


class ICategoryRepo(ABC):
    @abstractmethod
    def list_all(self) -> list[Category]: ...

    @abstractmethod
    def get_by_id(self, id: int) -> Category: ...

    @abstractmethod
    def create(self, data: NewCategory) -> Category: ...

    @abstractmethod
    def update(self, id: int, data: NewCategory) -> Category: ...

    @abstractmethod
    def delete(self, id: int) -> None: ...
