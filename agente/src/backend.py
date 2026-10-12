import requests

from src.constantes.constantes_red import LOGIN_PATH
from src.errors.error_backend import BackendError


class Backend:
    """Cliente HTTP del backend de inventario: sesión compartida, JWT con reinicio de sesión y subida de imágenes."""

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._session = requests.Session()
        self._credentials: tuple[str, str] | None = None

    def login(self, username: str, password: str) -> None:
        """Inicia sesión y guarda las credenciales para renovarla sola cuando el token expire."""
        self._credentials = (username, password)
        token = self.post(LOGIN_PATH, {"username": username, "password": password})["token"]
        self._session.headers["Authorization"] = f"Bearer {token}"

    def get(self, path: str, params: dict | None = None):
        return self._request("GET", path, params=params)

    def post(self, path: str, json: dict):
        return self._request("POST", path, json=json)

    def put(self, path: str, json: dict):
        return self._request("PUT", path, json=json)

    def delete(self, path: str) -> None:
        self._request("DELETE", path)

    def upload_image(self, data: bytes, filename: str) -> str:
        """Sube la imagen y retorna su URL pública."""
        return self._request("POST", "/articles/upload", files={"image": (filename, data)})["url"]

    def _request(self, method: str, path: str, **kwargs):
        res = self._send(method, path, **kwargs)
        if self._session_expired(res, path):
            self.login(*self._credentials)
            res = self._send(method, path, **kwargs)
        if res.ok:
            return self._json(res)
        raise BackendError(f"{res.status_code}: {self._message(res)}")

    def _send(self, method: str, path: str, **kwargs) -> requests.Response:
        return self._session.request(method, f"{self._base_url}{path}", **kwargs)

    def _session_expired(self, res: requests.Response, path: str) -> bool:
        """Un 401 fuera del login, habiendo iniciado sesión antes, indica que el token expiró o se cerró."""
        return res.status_code == 401 and self._credentials is not None and path != LOGIN_PATH

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
