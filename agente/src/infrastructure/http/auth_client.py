from ...domain.ports import IAuthRepo
from .base_client import BaseHttpClient


class AuthHttpClient(IAuthRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def login(self, username: str, password: str) -> str:
        data = self._client.post("/auth/login", {"username": username, "password": password})
        token = data["token"]
        self._client.set_token(token)
        return token
