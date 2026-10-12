from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeStock, SafeText, SafeUrl


class ArticleUpdateDto(DtoBase):
    """Datos para actualizar un artículo: solo article_name es obligatorio."""

    article_name: SafeName
    name: SafeName | None = None
    category_name: SafeName | None = None
    stock: SafeStock | None = None
    description: SafeText | None = None
    image_url: SafeUrl | None = None
