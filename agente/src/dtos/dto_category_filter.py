from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class CategoryFilterDto(DtoBase):
    """Listado de artículos, opcionalmente filtrado por el nombre aproximado de una categoría."""

    category_name: SafeName | None = None
