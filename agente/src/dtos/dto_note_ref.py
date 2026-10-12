from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeTitle


class NoteRefDto(DtoBase):
    """Tools que identifican una nota por su artículo y por su título aproximado."""

    article_name: SafeName
    note_title: SafeTitle
