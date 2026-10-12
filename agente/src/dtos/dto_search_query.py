from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeTitle


class SearchQueryDto(DtoBase):
    """Consulta de búsqueda aproximada."""

    q: SafeTitle
