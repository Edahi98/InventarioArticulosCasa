from typing import Literal

from pydantic import Field, model_validator

from src.constantes.constantes_validacion import (
    FILENAME_PATTERN,
    IMAGE_SIGNATURES,
    MAX_UPLOAD_BYTES,
)
from src.dtos.dto_base import DtoBase


class UploadDto(DtoBase):
    """Imagen que llega por /upload o por una foto de Telegram: nombre, tipo, tamaño y firma del archivo."""

    filename: str = Field(pattern=FILENAME_PATTERN)
    content_type: Literal["image/jpeg", "image/png", "image/webp", "image/gif"]
    data: bytes = Field(min_length=1, max_length=MAX_UPLOAD_BYTES)

    @model_validator(mode="after")
    def check_signature(self):
        if not self.data.startswith(IMAGE_SIGNATURES):
            raise ValueError("el archivo no es una imagen válida")
        return self
