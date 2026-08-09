from abc import ABC, abstractmethod
from ..entities import Article, NewArticle


class IArticleRepo(ABC):
    @abstractmethod
    def list_all(self, category_id: int | None = None) -> list[Article]: ...

    @abstractmethod
    def get_by_id(self, id: int) -> Article: ...

    @abstractmethod
    def create(self, data: NewArticle) -> Article: ...

    @abstractmethod
    def update(self, id: int, data: NewArticle) -> Article: ...

    @abstractmethod
    def delete(self, id: int) -> None: ...
