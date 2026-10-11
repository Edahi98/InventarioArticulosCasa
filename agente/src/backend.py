import requests

from src.errors.error_backend import BackendError


class Backend:
    """Cliente HTTP del backend de inventario: sesión compartida, JWT y subida de imágenes."""

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._session = requests.Session()

    def login(self, username: str, password: str) -> None:
        token = self.post("/auth/login", {"username": username, "password": password})["token"]
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
        res = self._session.request(method, f"{self._base_url}{path}", **kwargs)
        if res.ok:
            return self._json(res)
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
