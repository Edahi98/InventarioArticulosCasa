from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.constantes.constantes_svg import MAX_SVG
from src.services.guard_svg import SvgGuard


class SvgDto(BaseModel):
    """
    SVG que el agente dibuja para convertirlo a PNG. No hereda de DtoBase porque este rechaza cualquier
    etiqueta; en su lugar SvgGuard permite solo formas y degradados y bloquea scripts y recursos externos.
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    svg: str = Field(min_length=1, max_length=MAX_SVG)

    @field_validator("svg")
    @classmethod
    def only_safe_svg(cls, value: str) -> str:
        return SvgGuard.check(value)
