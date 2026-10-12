import threading
from datetime import datetime, timezone

from src.dtos.dto_bot_session import BotSessionDto


class BotSessions:
    """
    Sesiones de Telegram vinculadas desde la web, solo en memoria: telegram_id -> sesión del backend.
    Si el bot se reinicia o la sesión vence, la persona vuelve a vincular con un código nuevo.
    """

    def __init__(self) -> None:
        self._sessions: dict[int, BotSessionDto] = {}
        self._lock = threading.Lock()

    def link(self, telegram_id: int, session: BotSessionDto) -> None:
        with self._lock:
            self._sessions[telegram_id] = session

    def get(self, telegram_id: int) -> BotSessionDto | None:
        """La sesión vigente de esa persona; si ya venció la descarta y retorna None."""
        with self._lock:
            session = self._sessions.get(telegram_id)
            if session and session.expires_at <= datetime.now(timezone.utc):
                del self._sessions[telegram_id]
                return None
            return session

    def drop(self, telegram_id: int) -> BotSessionDto | None:
        with self._lock:
            return self._sessions.pop(telegram_id, None)
