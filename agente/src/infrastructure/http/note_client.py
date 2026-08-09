from ...domain.entities import Note, NewNote
from ...domain.ports import INoteRepo
from .base_client import BaseHttpClient


def _parse(raw: dict) -> Note:
    return Note(
        id=raw["id"],
        title=raw["title"],
        articleId=raw["articleId"],
        description=raw.get("description", ""),
    )


class NoteHttpClient(INoteRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def list_by_article(self, article_id: int) -> list[Note]:
        return [_parse(r) for r in self._client.get("/notes", params={"articleId": article_id})]

    def get_by_id(self, id: int) -> Note:
        return _parse(self._client.get(f"/notes/{id}"))

    def create(self, data: NewNote) -> Note:
        return _parse(self._client.post("/notes", {
            "title": data.title,
            "description": data.description,
            "articleId": data.articleId,
        }))

    def update(self, id: int, title: str, description: str) -> Note:
        return _parse(self._client.put(f"/notes/{id}", {"title": title, "description": description}))

    def delete(self, id: int) -> None:
        self._client.delete(f"/notes/{id}")
