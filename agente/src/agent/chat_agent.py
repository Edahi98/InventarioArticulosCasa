import logging

from langchain_core.messages import ToolMessage
from langgraph.pregel import Pregel as CompiledGraph

from src.services.images.renderer_image import CardImageRenderer
from src.utilerias.util_codec import Codec


logger = logging.getLogger(__name__)


class AgentChat:
    """Conversa con el agente y traduce lo que devuelven sus tools a texto o fichas (PNG)."""

    def __init__(self, agent: CompiledGraph) -> None:
        self._agent = agent
        self._renderer = CardImageRenderer()

    def ask(self, message: str) -> tuple[str, list[bytes]]:
        """Respuesta del agente: (texto del modelo, imágenes PNG de las fichas). Una sola petición al modelo."""
        result = self._agent.invoke({"messages": [{"role": "user", "content": message}]})
        messages = result["messages"]
        tools = [m for m in messages if isinstance(m, ToolMessage)]
        logger.info("tools usadas: %s", [m.name for m in tools] or "ninguna")
        results = [Codec.parse(m.content) for m in tools]
        images = self._renderer.render(results)
        return messages[-1].content, images
