from pydantic import Field

from src.dtos.dto_base import DtoBase


class LinkCodeDto(DtoBase):
    """Código de vinculación que la persona escribe en Telegram (el que generó en la página web)."""

    code: str = Field(pattern=r"^[A-Za-z0-9 -]{6,20}$")
