from functools import wraps

import requests

from src.errors.error_backend import BackendError


class ErrorHandler:
    """Decorador de métodos: los errores esperados se devuelven como texto en vez de propagarse."""

    _ERRORS = (BackendError, ValueError, requests.RequestException)

    @classmethod
    def safe(cls, fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except cls._ERRORS as e:
                return str(e)
        return wrapper
