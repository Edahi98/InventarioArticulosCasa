from abc import ABC, abstractmethod


class IAuthRepo(ABC):
    @abstractmethod
    def login(self, username: str, password: str) -> str:
        """Retorna el JWT token."""
