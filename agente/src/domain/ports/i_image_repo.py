from abc import ABC, abstractmethod


class IImageRepo(ABC):
    @abstractmethod
    def upload(self, data: bytes, filename: str) -> str:
        """Sube imagen y retorna su URL pública."""
