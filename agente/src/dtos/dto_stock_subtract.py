from pydantic import Field

from src.constantes.constantes_validacion import MAX_STOCK
from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class StockSubtractDto(DtoBase):
    """Resta unidades al stock de un artículo (una por defecto)."""

    article_name: SafeName
    amount: int = Field(default=1, ge=1, le=MAX_STOCK)
