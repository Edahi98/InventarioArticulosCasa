from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeLocation, SafeName, SafeText, SafeUrl


class CategoryCreateDto(DtoBase):
    """Datos para crear una categoría."""

    name: SafeName
    description: SafeText = ""
    image_url: SafeUrl = ""
    location: SafeLocation = ""
