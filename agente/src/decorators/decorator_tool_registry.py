import inspect

from langchain_core.tools import tool

from src.decorators.decorator_error_handler import ErrorHandler


class ToolRegistry:
    """Decorador de clase: registra como tools de LangChain todos los métodos públicos de la clase."""

    @classmethod
    def register(cls, klass):
        """Aplica `ErrorHandler.safe` a cada método público y añade `tools()` con todos ellos."""
        names = [n for n, v in vars(klass).items() if inspect.isfunction(v) and not n.startswith("_")]
        for name in names:
            setattr(klass, name, ErrorHandler.safe(getattr(klass, name)))
        klass.tools = lambda self: [tool(getattr(self, name)) for name in names]
        return klass
