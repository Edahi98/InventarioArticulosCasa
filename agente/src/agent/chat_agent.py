import logging

from langchain_core.messages import ToolMessage
from langgraph.pregel import Pregel as CompiledGraph

from src.services.images.renderer_image import CardImageRenderer
from src.services.memory_focus import FocusMemory
from src.utilerias.util_codec import Codec


logger = logging.getLogger(__name__)

DELETE_PREFIX = "eliminar"


class AgentChat:
    """
    Conversa con el agente y traduce lo que devuelven sus tools a texto o fichas (PNG). Recuerda por persona
    el artículo o la categoría del último mensaje para anteponerlo al siguiente.
    """

    def __init__(self, agent: CompiledGraph) -> None:
        self._agent = agent
        self._renderer = CardImageRenderer()
        self._focus = FocusMemory()

    def ask(self, message: str, key: str) -> tuple[str, list[bytes]]:
        """
        Respuesta del agente: (texto del modelo, imágenes PNG de las fichas). Una sola petición al modelo.
        `key` identifica a la persona (tg:<id>, api:<sub> o cli) para recordar de qué se estaba hablando.
        """
        framed = self._focus.frame(key, message)
        result = self._agent.invoke({"messages": [{"role": "user", "content": framed}]})
        messages = result["messages"]
        tools = [m for m in messages if isinstance(m, ToolMessage)]
        logger.info("tools usadas: %s", [m.name for m in tools] or "ninguna")
        results = [Codec.parse(m.content) for m in tools]
        self._remember(key, tools, results)
        images = self._renderer.render(results)
        return messages[-1].content, images

    def forget(self, key: str) -> None:
        """Olvida el contexto de esa persona (al cerrar sesión)."""
        self._focus.forget(key)

    def _remember(self, key: str, tools: list[ToolMessage], results: list) -> None:
        """Recuerda lo de este turno, salvo lo eliminado; si se eliminó algo, el contexto anterior ya no sirve."""
        if any((m.name or "").startswith(DELETE_PREFIX) for m in tools):
            self._focus.forget(key)
        kept = [r for m, r in zip(tools, results) if not (m.name or "").startswith(DELETE_PREFIX)]
        self._focus.remember(key, kept)
