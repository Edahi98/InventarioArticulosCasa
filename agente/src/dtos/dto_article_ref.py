from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeName


class ArticleRefDto(DtoBase):
    """Tools que identifican un artículo por su nombre aproximado."""

    article_name: SafeName
