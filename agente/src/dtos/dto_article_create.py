from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName, SafeStock, SafeText, SafeUrl


class ArticleCreateDto(DtoBase):
    """Datos para crear un artículo."""

    name: SafeName
    category_name: SafeName
    stock: SafeStock = 0
    description: SafeText = ""
    image_url: SafeUrl = ""
    needs_repair: bool = False
