from abc import ABC, abstractmethod
from ..entities import SearchResult


class ISearchRepo(ABC):
    @abstractmethod
    def search(self, q: str) -> list[SearchResult]: ...
