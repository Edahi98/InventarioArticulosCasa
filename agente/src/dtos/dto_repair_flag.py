from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class RepairFlagDto(DtoBase):
    """Marca o desmarca un artículo como pendiente de reparación."""

    article_name: SafeName
    needs_repair: bool
