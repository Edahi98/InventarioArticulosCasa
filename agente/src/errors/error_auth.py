class AuthError(Exception):
    """Error de autenticación: el mensaje se devuelve al cliente y `status` es el código HTTP."""

    def __init__(self, message: str, status: int = 401) -> None:
        super().__init__(message)
        self.status = status
