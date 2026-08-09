from ...domain.entities import SearchResult
from ...domain.ports import ISearchRepo
from .base_client import BaseHttpClient


class SearchHttpClient(ISearchRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def search(self, q: str) -> list[SearchResult]:
        results = self._client.get("/search", params={"q": q})
        return [
            SearchResult(
                type=r.get("type", ""),
                id=r.get("id", 0),
                name=r.get("name", ""),
                extra={k: v for k, v in r.items() if k not in ("type", "id", "name")},
            )
            for r in results
        ]
