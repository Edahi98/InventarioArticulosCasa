from pydantic import Field

from src.constantes.constantes_validacion import MAX_URL, URL_PATTERN
from src.dtos.dto_base import DtoBase


class PageUrlDto(DtoBase):
    """URL http(s) de una página web que se va a leer en busca de una lista."""

    url: str = Field(min_length=1, max_length=MAX_URL, pattern=URL_PATTERN)
