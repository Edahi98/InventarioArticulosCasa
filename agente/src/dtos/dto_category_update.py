from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeLocation, SafeName, SafeText, SafeUrl


class CategoryUpdateDto(DtoBase):
    """Datos para actualizar una categoría: solo category_name es obligatorio."""

    category_name: SafeName
    name: SafeName | None = None
    description: SafeText | None = None
    image_url: SafeUrl | None = None
    location: SafeLocation | None = None
