from functools import wraps

from flask import g, jsonify, request

from src.constantes.constantes_auth import BEARER_PREFIX, MISSING_TOKEN
from src.errors.error_auth import AuthError
from src.services.context_auth import AuthContext


class JwtRequired:
    """
    Decorador de endpoints Flask: exige `Authorization: Bearer <jwt>` emitido por el backend.
    La clase decorada debe exponer `_verifier` (TokenVerifier). Deja los claims en `flask.g.auth` y reenvía
    el mismo token al backend (AuthContext) para actuar como ese usuario; si el token falta o no es válido
    responde 401 sin ejecutar el endpoint.
    """

    @classmethod
    def endpoint(cls, fn):
        @wraps(fn)
        def wrapper(self, *args, **kwargs):
            try:
                token = cls._bearer()
                g.auth = self._verifier.verify(token)
            except AuthError as error:
                response = jsonify({"error": str(error)})
                response.status_code = error.status
                response.headers["WWW-Authenticate"] = "Bearer"
                return response
            with AuthContext.as_user(token):
                return fn(self, *args, **kwargs)
        return wrapper

    @staticmethod
    def _bearer() -> str:
        header = request.headers.get("Authorization", "")
        if not header.startswith(BEARER_PREFIX) or not header[len(BEARER_PREFIX):].strip():
            raise AuthError(MISSING_TOKEN)
        return header[len(BEARER_PREFIX):].strip()
