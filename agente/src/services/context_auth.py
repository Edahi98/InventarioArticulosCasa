from contextlib import contextmanager
from contextvars import ContextVar


class AuthContext:
    """
    Token del usuario en nombre de quien se atiende la petición actual (Telegram, API HTTP o CLI).
    El agente no guarda credenciales ni inicia sesión: solo reenvía el token que recibió.
    """

    _token: ContextVar[str | None] = ContextVar("auth_token", default=None)

    @classmethod
    @contextmanager
    def as_user(cls, token: str | None):
        """Mientras dure el bloque, las llamadas al backend usan este token."""
        reset = cls._token.set(token)
        try:
            yield
        finally:
            cls._token.reset(reset)

    @classmethod
    def headers(cls) -> dict[str, str]:
        """Cabecera Authorization del usuario actual, o vacía si no hay token."""
        token = cls._token.get()
        return {"Authorization": f"Bearer {token}"} if token else {}
