from pydantic import Field

from src.constantes.constantes_validacion import MAX_BATCH_NOTES
from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeTitle


class NotesRefDto(DtoBase):
    """Tools que identifican varias notas de un artículo por su título aproximado."""

    article_name: SafeName
    note_titles: list[SafeTitle] = Field(min_length=1, max_length=MAX_BATCH_NOTES)
