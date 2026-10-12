import jwt
from jwt import PyJWKClient

from src.constantes.constantes_auth import (
    INVALID_TOKEN,
    JWKS_CACHE_SECONDS,
    JWT_ALGORITHMS,
    JWT_AUDIENCE,
    JWT_LEEWAY_SECONDS,
    KEYS_UNAVAILABLE,
    REQUIRED_CLAIMS,
)
from src.errors.error_auth import AuthError


class TokenVerifier:
    """
    Verifica los JWT que emite el backend (RS256) con su clave pública publicada en el JWKS.
    No guarda secretos: descarga el JWKS, lo mantiene en caché y solo valida; nunca puede firmar tokens.
    """

    def __init__(self, jwks_url: str, issuer: str) -> None:
        self._issuer = issuer
        self._keys = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=JWKS_CACHE_SECONDS)

    def verify(self, token: str) -> dict:
        """
        Comprueba firma, expiración, emisor y destinatario del token.

        Retorna los claims (sub, username, ...). Lanza AuthError 401 si el token no es válido
        y 503 si el backend no entrega su clave pública.
        """
        try:
            key = self._keys.get_signing_key_from_jwt(token).key
            return jwt.decode(
                token,
                key,
                algorithms=JWT_ALGORITHMS,
                issuer=self._issuer,
                audience=JWT_AUDIENCE,
                leeway=JWT_LEEWAY_SECONDS,
                options={"require": REQUIRED_CLAIMS},
            )
        except jwt.PyJWKClientConnectionError as error:
            raise AuthError(KEYS_UNAVAILABLE, 503) from error
        except jwt.PyJWTError as error:
            raise AuthError(INVALID_TOKEN) from error
