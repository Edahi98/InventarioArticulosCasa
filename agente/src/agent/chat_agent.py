from langchain_core.messages import ToolMessage
from langgraph.pregel import Pregel as CompiledGraph

from src.services.images.renderer_image import CardImageRenderer
from src.utilerias.util_chat import Chat
from src.utilerias.util_codec import Codec


class AgentChat:
    """Conversa con el agente y traduce lo que devuelven sus tools a texto o fichas (PNG)."""

    def __init__(self, agent: CompiledGraph) -> None:
        self._agent = agent
        self._renderer = CardImageRenderer()

    def ask(self, message: str) -> tuple[str, list[bytes]]:
        """Respuesta del agente: (texto, imágenes PNG). Si hay imágenes, el texto va vacío."""
        result = self._agent.invoke({"messages": [{"role": "user", "content": message}]})
        messages = result["messages"]
        results = [Codec.parse(m.content) for m in messages if isinstance(m, ToolMessage)]
        images = [img for data in results for img in self._renderer.render(data)]
        text = " ".join(filter(None, map(Chat.as_text, results))) or messages[-1].content
        return ("" if images else text), images
