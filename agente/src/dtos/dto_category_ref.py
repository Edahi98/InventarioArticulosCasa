from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class CategoryRefDto(DtoBase):
    """Tools que identifican una categoría por su nombre aproximado."""

    category_name: SafeName
