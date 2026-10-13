from src.constantes.constantes_agente import FOCUS_FRAME, FOCUS_MAX_ITEMS, FOCUS_TTL_SECONDS
from src.constantes.constantes_estado import NS_FOCUS
from src.utilerias.util_registro import Records


class FocusMemory:
    """
    Recuerda por persona el artículo o la categoría de los que se habló en el último mensaje y los antepone al
    siguiente, para que "ese", "cámbiale el stock" o "elimínala" sepan a cuál se refieren. Vive en el almacén de
    estado (memoria o Postgres) con caducidad.
    """

    def __init__(self, store, ttl: int = FOCUS_TTL_SECONDS) -> None:
        self._store = store
        self._ttl = ttl

    def frame(self, key: str, message: str) -> str:
        """El mensaje precedido del contexto vigente de esa persona; sin contexto retorna el mensaje igual."""
        subjects = self._store.get(NS_FOCUS, key)
        if subjects is None:
            return message
        return f"{FOCUS_FRAME.format(subjects=subjects)}\n{message}"

    def remember(self, key: str, results: list) -> None:
        """Guarda los artículos y categorías de los resultados de las tools; si no hay ninguno, conserva lo anterior."""
        records = Records.unique(Records.flatten(results))
        subjects = [self._describe(r) for r in records if Records.is_article(r) or Records.is_category(r)]
        if not subjects:
            return
        self._store.put(NS_FOCUS, key, "; ".join(subjects[-FOCUS_MAX_ITEMS:]), self._ttl)

    def forget(self, key: str) -> None:
        self._store.delete(NS_FOCUS, key)

    @staticmethod
    def _describe(record: dict) -> str:
        if Records.is_category(record):
            return f'categoría "{record["name"]}" (id {record["id"]})'
        category = f", categoría {record['categoryName']}" if record.get("categoryName") else ""
        return f'artículo "{record.get("name", "")}" (id {record.get("id")}{category})'
