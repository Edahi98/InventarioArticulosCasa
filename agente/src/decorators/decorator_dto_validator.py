import inspect
from functools import wraps

from flask import jsonify, request
from pydantic import ValidationError

from src.constantes.constantes_validacion import DEFAULT_ERROR_MESSAGE, ERROR_MESSAGES


class DtoValidator:
    """
    Decoradores de métodos que validan la entrada con un DTO de pydantic antes de ejecutarlos:
    `tool` para las tools del agente, `json` y `upload` para endpoints Flask.
    """

    @classmethod
    def issues(cls, error: ValidationError) -> list[dict[str, str]]:
        """Problemas de un ValidationError como [{campo, mensaje}], sin devolver el valor recibido."""
        return [
            {"field": ".".join(str(part) for part in item["loc"]) or "entrada", "message": cls._message(item)}
            for item in error.errors()
        ]

    @classmethod
    def describe(cls, error: ValidationError) -> str:
        """Los problemas de un ValidationError en una sola frase legible."""
        details = "; ".join(f"{issue['field']} {issue['message']}" for issue in cls.issues(error))
        return f"Datos no válidos: {details}."

    @classmethod
    def tool(cls, dto):
        """
        Valida los argumentos de una tool contra `dto`. Va por fuera de NameLookup, así que ve
        los nombres que manda el LLM (article_name, category_name...). Un error vuelve como ValueError.
        """
        def decorator(fn):
            signature = inspect.signature(fn)

            @wraps(fn)
            def wrapper(self, *args, **kwargs):
                given = dict(signature.bind(self, *args, **kwargs).arguments)
                given.pop("self")
                try:
                    checked = dto.model_validate(given)
                except ValidationError as error:
                    raise ValueError(cls.describe(error)) from error
                return fn(self, **{**given, **checked.model_dump(exclude_unset=True)})
            return wrapper
        return decorator

    @classmethod
    def json(cls, dto):
        """Valida el cuerpo JSON de la petición y pasa el DTO como primer argumento tras `self`."""
        return cls._http(dto, lambda: request.get_json(silent=True) or {})

    @classmethod
    def upload(cls, dto, field: str = "image"):
        """Valida un archivo multipart (nombre, tipo, tamaño y firma) y pasa el DTO tras `self`."""
        return cls._http(dto, lambda: cls._file(field))

    @classmethod
    def _http(cls, dto, source):
        def decorator(fn):
            @wraps(fn)
            def wrapper(self, *args, **kwargs):
                try:
                    checked = dto.model_validate(source())
                except ValidationError as error:
                    return jsonify({"error": "Datos no válidos.", "details": cls.issues(error)}), 422
                return fn(self, checked, *args, **kwargs)
            return wrapper
        return decorator

    @staticmethod
    def _file(field: str) -> dict:
        file = request.files.get(field)
        if file is None:
            return {}
        return {"filename": file.filename or "", "content_type": file.mimetype, "data": file.read()}

    @staticmethod
    def _message(item: dict) -> str:
        if item["type"] == "value_error":
            return str(item["ctx"]["error"])
        return ERROR_MESSAGES.get(item["type"], DEFAULT_ERROR_MESSAGE)
