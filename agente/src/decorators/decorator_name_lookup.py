import inspect
from functools import wraps

from src.constantes.constantes_agente import ARTICLES, CATEGORIES, NOTES
from src.utilerias.util_valor import Valor


class NameLookup:
    """
    Decoradores de métodos que cambian el nombre aproximado dado por el LLM por el id del registro.
    El método decorado debe estar en una clase que exponga `_resolver` (NameResolver).
    """

    @classmethod
    def by_name(cls, id_param: str, name_param: str, resource: str, empty: str,
                filters: dict[str, str] | None = None, optional: bool = False):
        """
        El método decorado declara `id_param` (el id ya resuelto) pero al LLM se le expone `name_param`.
        `filters` mapea parámetros de consulta -> parámetros ya resueltos por otro decorador.
        """
        exposed_type = (str | None) if optional else str
        default = None if optional else inspect.Parameter.empty

        def decorator(fn):
            @wraps(fn)
            def wrapper(self, *args, **kwargs):
                query = kwargs.pop(name_param, None)
                if not Valor.given(query) and not optional:
                    raise ValueError(f"Falta indicar {name_param}.")
                scope = {q: kwargs[resolved] for q, resolved in (filters or {}).items()}
                kwargs[id_param] = (
                    self._resolver.resolve(resource, query, empty, **scope) if Valor.given(query) else None
                )
                return fn(self, *args, **kwargs)

            return cls._expose(wrapper, fn, id_param, name_param, exposed_type, default)
        return decorator

    @classmethod
    def by_names(cls, id_param: str, name_param: str, resource: str, empty: str):
        """
        Como `by_name`, pero el LLM da una lista de nombres opcional y el método decorado recibe en `id_param`
        la lista de ids (sin repetir), o None si no se indicó ninguno.
        """
        def decorator(fn):
            @wraps(fn)
            def wrapper(self, *args, **kwargs):
                queries = [q for q in (kwargs.pop(name_param, None) or []) if Valor.given(q)]
                ids = [self._resolver.resolve(resource, query, empty) for query in queries]
                kwargs[id_param] = list(dict.fromkeys(ids)) or None
                return fn(self, *args, **kwargs)

            return cls._expose(wrapper, fn, id_param, name_param, list[str] | None, None)
        return decorator

    @classmethod
    def article(cls, optional: bool = False):
        return cls.by_name("article_id", "article_name", ARTICLES, "No hay artículos disponibles.", optional=optional)

    @classmethod
    def category(cls, optional: bool = False):
        return cls.by_name("category_id", "category_name", CATEGORIES, "No hay categorías disponibles.", optional=optional)

    @classmethod
    def categories(cls):
        return cls.by_names("category_ids", "category_names", CATEGORIES, "No hay categorías disponibles.")

    @classmethod
    def note(cls):
        return cls.by_name("note_id", "note_title", NOTES, "No hay notas para ese artículo.",
                           filters={"articleId": "article_id"})

    @staticmethod
    def _expose(wrapper, fn, id_param: str, name_param: str, exposed_type, default):
        """Cambia en la firma que ve el LLM el parámetro `id_param` por `name_param`."""
        signature = inspect.signature(fn)
        params = [
            p.replace(name=name_param, annotation=exposed_type, default=default) if name == id_param else p
            for name, p in signature.parameters.items()
        ]
        wrapper.__signature__ = signature.replace(parameters=params)
        wrapper.__annotations__ = {
            **{k: v for k, v in fn.__annotations__.items() if k != id_param},
            name_param: exposed_type,
        }
        return wrapper
