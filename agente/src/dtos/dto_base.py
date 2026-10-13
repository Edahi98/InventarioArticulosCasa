from pydantic import BaseModel, ConfigDict, field_validator

from src.constantes.constantes_validacion import INJECTION_MESSAGE
from src.utilerias.util_inyeccion import Injection


class DtoBase(BaseModel):
    """Base de todos los DTO: recorta espacios, prohíbe campos extra y rechaza scripts y SQL en cualquier texto."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    @field_validator("*", mode="before")
    @classmethod
    def reject_injection(cls, value):
        return cls._clean(value)

    @classmethod
    def _clean(cls, value):
        """Textos (también los de una lista) sin scripts ni SQL y normalizados; cualquier otro valor pasa igual."""
        if isinstance(value, list):
            return [cls._clean(item) for item in value]
        if not isinstance(value, str):
            return value
        if Injection.detect(value):
            raise ValueError(INJECTION_MESSAGE)
        return Injection.normalize(value)
