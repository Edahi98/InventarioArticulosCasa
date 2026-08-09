from ...domain.entities import Note, NewNote
from ...domain.ports import INoteRepo


class NoteService:
    def __init__(self, repo: INoteRepo) -> None:
        self._repo = repo

    def list_by_article(self, article_id: int) -> list[Note]:
        return self._repo.list_by_article(article_id)

    def get_by_id(self, id: int) -> Note:
        return self._repo.get_by_id(id)

    def create(self, title: str, article_id: int, description: str = "") -> Note:
        return self._repo.create(NewNote(title=title, articleId=article_id, description=description))

    def update(self, id: int, title: str, description: str = "") -> Note:
        return self._repo.update(id, title, description)

    def delete(self, id: int) -> None:
        self._repo.delete(id)
