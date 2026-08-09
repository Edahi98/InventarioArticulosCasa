import requests
from dataclasses import dataclass


@dataclass
class AgentResponse:
    reply: str
    images: list[bytes]  # PNGs ya decodificados, listos para enviar a Telegram


class AgentClient:
    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")

    def chat(self, message: str) -> AgentResponse:
        import base64
        res = requests.post(f"{self._base_url}/chat", json={"message": message}, timeout=180)
        res.raise_for_status()
        body = res.json()
        images = [base64.b64decode(b64) for b64 in body.get("images", [])]
        return AgentResponse(reply=body.get("reply", ""), images=images)

    def upload_image(self, data: bytes, filename: str) -> str:
        """Única petición directa: binario de imagen → URL pública."""
        res = requests.post(
            f"{self._base_url}/upload",
            files={"image": (filename, data)},
            timeout=60,
        )
        res.raise_for_status()
        return res.json()["url"]
