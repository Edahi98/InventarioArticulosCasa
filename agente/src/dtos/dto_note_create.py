from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeText, SafeTitle


class NoteCreateDto(DtoBase):
    """Datos para crear una nota en un artículo."""

    article_name: SafeName
    title: SafeTitle
    description: SafeText = ""
