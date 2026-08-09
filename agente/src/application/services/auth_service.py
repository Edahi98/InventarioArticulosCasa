from ...domain.ports import IAuthRepo


class AuthService:
    def __init__(self, repo: IAuthRepo) -> None:
        self._repo = repo

    def login(self, username: str, password: str) -> str:
        return self._repo.login(username, password)
