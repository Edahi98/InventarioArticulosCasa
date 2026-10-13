import json

from src.constantes.constantes_agente import CHOICE_KEY, CHOICE_MESSAGE


class AmbiguousName(ValueError):
    """El nombre que dio la persona coincide con varios registros; su texto es la petición de elegir en JSON."""

    def __init__(self, resource: str, options: list[dict]) -> None:
        super().__init__(resource)
        self.resource = resource
        self.options = options

    def __str__(self) -> str:
        payload = {"resource": self.resource, "options": self.options, "message": CHOICE_MESSAGE}
        return json.dumps({CHOICE_KEY: payload}, ensure_ascii=False)
