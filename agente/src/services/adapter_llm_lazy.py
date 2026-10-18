import logging
import threading
from collections.abc import Callable

logger = logging.getLogger(__name__)


class LazyLlm:
    """
    Chat que crea el modelo real hasta la primera vez que se usa (un modelo local pesa gigas y no debe cargarse
    al arrancar). Lo comparten todas las copias creadas con `bind_tools`, así que el modelo se carga una sola vez.
    """

    _lock = threading.Lock()

    def __init__(self, factory: Callable[[], object], tools: tuple | None = None, shared: dict | None = None) -> None:
        self._factory = factory
        self._tools = tools
        self._shared = {} if shared is None else shared

    def bind_tools(self, tools: list, **kwargs) -> "LazyLlm":
        """Igual que en un chat de LangChain: devuelve un chat que usará esas tools al invocarse."""
        return LazyLlm(self._factory, (tools, kwargs), self._shared)

    def invoke(self, messages, **kwargs):
        """Carga el modelo si es la primera vez y responde a los mensajes."""
        model = self._model()
        bound = model if self._tools is None else model.bind_tools(self._tools[0], **self._tools[1])
        return bound.invoke(messages, **kwargs)

    def _model(self):
        with self._lock:
            if "model" not in self._shared:
                logger.info("Cargando el modelo local; la primera respuesta tardará más")
                self._shared["model"] = self._factory()
                logger.info("Modelo local cargado")
            return self._shared["model"]
