from src.constantes.constantes_agente import CHOICE_FOLLOWUP, CHOICE_TARGETS, CHOICE_TTL_SECONDS
from src.constantes.constantes_estado import NS_CHOICE


class ChoiceMemory:
    """
    Guarda por persona las opciones que se le mostraron cuando un nombre coincidió con varios registros, junto con
    el mensaje original, para retomar la petición con la opción elegida. Vive en el almacén de estado (memoria o
    Postgres) con caducidad.
    """

    def __init__(self, store, ttl: int = CHOICE_TTL_SECONDS) -> None:
        self._store = store
        self._ttl = ttl

    def offer(self, key: str, message: str, resource: str, options: list[dict]) -> None:
        self._store.put(NS_CHOICE, key, {"message": message, "resource": resource, "options": options}, self._ttl)

    def options(self, key: str) -> list[dict] | None:
        """Las opciones vigentes de esa persona o None si no hay o ya caducaron."""
        offer = self._store.get(NS_CHOICE, key)
        return None if offer is None else offer["options"]

    def pick(self, key: str, index: int) -> str | None:
        """
        Consume la oferta y devuelve el mensaje original con la opción `index` elegida; None si no hay oferta
        vigente o el índice no existe.
        """
        offer = self._store.get(NS_CHOICE, key)
        if offer is None or not 0 <= index < len(offer["options"]):
            return None
        self._store.delete(NS_CHOICE, key)
        noun, param = CHOICE_TARGETS[offer["resource"]]
        chosen = offer["options"][index]
        detail = f" (categoría {chosen['detail']})" if chosen.get("detail") else ""
        return CHOICE_FOLLOWUP.format(
            message=offer["message"], noun=noun, name=chosen["name"], detail=detail, param=param, id=chosen["id"]
        )

    def clear(self, key: str) -> None:
        self._store.delete(NS_CHOICE, key)
