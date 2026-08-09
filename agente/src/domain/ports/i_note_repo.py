from abc import ABC, abstractmethod
from ..entities import Note, NewNote


class INoteRepo(ABC):
    @abstractmethod
    def list_by_article(self, article_id: int) -> list[Note]: ...

    @abstractmethod
    def get_by_id(self, id: int) -> Note: ...

    @abstractmethod
    def create(self, data: NewNote) -> Note: ...

    @abstractmethod
    def update(self, id: int, title: str, description: str) -> Note: ...

    @abstractmethod
    def delete(self, id: int) -> None: ...
