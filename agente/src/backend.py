import mimetypes

import requests

from src.constantes.constantes_red import BACKEND_TIMEOUT_SECONDS, CLAIM_PATH, LOGOUT_PATH
from src.errors.error_backend import BackendError
from src.services.context_auth import AuthContext

SESSION_EXPIRED = "🐻🥺 Tu sesión ya no es válida o expiró. Vuelve a vincular tu cuenta desde la página web."


class Backend:
    """
    Cliente HTTP del backend de inventario. No inicia sesión: cada petición lleva el token del usuario
    actual (AuthContext), que siempre se obtuvo en la página web.
    """

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._session = requests.Session()

    def claim_link_code(self, code: str) -> dict:
        """Canjea un código de vinculación generado en la web por un token del usuario que lo generó."""
        return self._request("POST", CLAIM_PATH, auth=False, json={"code": code})

    def logout(self, token: str) -> None:
        """Cierra en el backend la sesión del token indicado."""
        self._request("POST", LOGOUT_PATH, auth=False, headers={"Authorization": f"Bearer {token}"})

    def get(self, path: str, params: dict | None = None):
        return self._request("GET", path, params=params)

    def post(self, path: str, json: dict):
        return self._request("POST", path, json=json)

    def put(self, path: str, json: dict):
        return self._request("PUT", path, json=json)

    def delete(self, path: str) -> None:
        self._request("DELETE", path)

    def upload_image(self, data: bytes, filename: str) -> str:
        """Sube la imagen y retorna su URL pública; el tipo se deduce de la extensión (JPEG por defecto)."""
        content_type = mimetypes.guess_type(filename)[0] or "image/jpeg"
        return self._request("POST", "/articles/upload", files={"image": (filename, data, content_type)})["url"]

    def _request(self, method: str, path: str, auth: bool = True, headers: dict | None = None, **kwargs):
        merged = {**(AuthContext.headers() if auth else {}), **(headers or {})}
        kwargs.setdefault("timeout", BACKEND_TIMEOUT_SECONDS)
        res = self._session.request(method, f"{self._base_url}{path}", headers=merged, **kwargs)
        if res.ok:
            return self._json(res)
        if auth and res.status_code == 401:
            raise BackendError(SESSION_EXPIRED)
        raise BackendError(f"{res.status_code}: {self._message(res)}")

    @staticmethod
    def _json(res: requests.Response):
        try:
            return res.json()
        except ValueError:
            return None

    @staticmethod
    def _message(res: requests.Response) -> str:
        try:
            body = res.json()
            return body.get("message") or body.get("error") or res.text
        except (ValueError, AttributeError):
            return res.text
