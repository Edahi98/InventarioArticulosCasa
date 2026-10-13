from pydantic import Field

from src.constantes.constantes_validacion import MAX_FILTER_CATEGORIES
from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class CategoriesFilterDto(DtoBase):
    """Listado de artículos, opcionalmente filtrado por los nombres aproximados de una o varias categorías."""

    category_names: list[SafeName] | None = Field(default=None, max_length=MAX_FILTER_CATEGORIES)
