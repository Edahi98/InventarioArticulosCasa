import requests
from requests import HTTPError


class BackendError(Exception):
    """Error con mensaje legible proveniente del backend."""


def _raise(res: requests.Response) -> None:
    if res.ok:
        return
    try:
        msg = res.json().get("message") or res.json().get("error") or res.text
    except Exception:
        msg = res.text
    raise BackendError(f"{res.status_code}: {msg}")


class BaseHttpClient:
    """Sesión HTTP compartida con token JWT inyectable."""

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

    def set_token(self, token: str) -> None:
        self._session.headers.update({"Authorization": f"Bearer {token}"})

    def get(self, path: str, **kwargs) -> dict | list:
        res = self._session.get(f"{self._base_url}{path}", **kwargs)
        _raise(res)
        return res.json()

    def post(self, path: str, json: dict) -> dict:
        res = self._session.post(f"{self._base_url}{path}", json=json)
        _raise(res)
        return res.json()

    def put(self, path: str, json: dict) -> dict:
        res = self._session.put(f"{self._base_url}{path}", json=json)
        _raise(res)
        return res.json()

    def delete(self, path: str) -> None:
        res = self._session.delete(f"{self._base_url}{path}")
        _raise(res)
