import requests as req_lib
from ...domain.ports.i_image_repo import IImageRepo
from .base_client import BaseHttpClient


class ImageHttpClient(IImageRepo):
    def __init__(self, client: BaseHttpClient) -> None:
        self._client = client

    def upload(self, data: bytes, filename: str) -> str:
        headers = {k: v for k, v in self._client._session.headers.items() if k != "Content-Type"}
        res = req_lib.post(
            f"{self._client._base_url}/articles/upload",
            files={"image": (filename, data)},
            headers=headers,
        )
        res.raise_for_status()
        return res.json()["url"]
