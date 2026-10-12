from pydantic import Field

from src.constantes.constantes_validacion import MAX_URL, URL_PATTERN
from src.dtos.dto_base import DtoBase


class ImageUrlDto(DtoBase):
    """URL http(s) de una imagen que se va a descargar y subir."""

    image_url: str = Field(min_length=1, max_length=MAX_URL, pattern=URL_PATTERN)
