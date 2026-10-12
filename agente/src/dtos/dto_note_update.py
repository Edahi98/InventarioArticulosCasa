from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeText, SafeTitle


class NoteUpdateDto(DtoBase):
    """Datos para actualizar una nota: article_name y note_title la identifican."""

    article_name: SafeName
    note_title: SafeTitle
    title: SafeTitle | None = None
    description: SafeText | None = None
