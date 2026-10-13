from datetime import datetime, timezone

from src.constantes.constantes_estado import NS_SESSION
from src.dtos.dto_bot_session import BotSessionDto


class BotSessions:
    """
    Sesiones de Telegram vinculadas desde la web: telegram_id -> sesión del backend. Viven en el almacén de
    estado hasta que vence el token; si no hay sesión, la persona vuelve a vincular con un código nuevo.
    """

    def __init__(self, store) -> None:
        self._store = store

    def link(self, telegram_id: int, session: BotSessionDto) -> None:
        ttl = max(1, int((session.expires_at - datetime.now(timezone.utc)).total_seconds()))
        self._store.put(NS_SESSION, str(telegram_id), session.model_dump(mode="json", by_alias=True), ttl)

    def get(self, telegram_id: int) -> BotSessionDto | None:
        """La sesión vigente de esa persona o None si no hay o ya venció."""
        data = self._store.get(NS_SESSION, str(telegram_id))
        if data is None:
            return None
        session = BotSessionDto.model_validate(data)
        return session if session.expires_at > datetime.now(timezone.utc) else None

    def drop(self, telegram_id: int) -> BotSessionDto | None:
        session = self.get(telegram_id)
        self._store.delete(NS_SESSION, str(telegram_id))
        return session
