from langchain_core.messages import AIMessage, SystemMessage
from langgraph.graph import MessagesState

from src.constantes.constantes_agente import SYSTEM_PROMPT, TOOL_TEXT_FAILED, TOOL_TEXT_HINT, TOOL_TEXT_MARKER


class ModelNode:
    """
    Nodo del grafo: le pasa la conversación al modelo y agrega su respuesta (texto o llamadas a tools). Si el
    modelo escribe una tool como texto en vez de llamarla, reintenta una vez y, si sigue igual, no deja ese texto.
    """

    def __init__(self, model, hint: str = "") -> None:
        self._model = model
        self._prompt = SystemMessage(content=f"{SYSTEM_PROMPT} {hint}".strip())
        self._retry_prompt = SystemMessage(content=f"{self._prompt.content} {TOOL_TEXT_HINT}")

    def __call__(self, state: MessagesState) -> dict:
        response = self._model.invoke([self._prompt, *state["messages"]])
        if self._leaked(response):
            response = self._model.invoke([self._retry_prompt, *state["messages"]])
        if self._leaked(response):
            response = AIMessage(content=TOOL_TEXT_FAILED)
        return {"messages": [response]}

    @staticmethod
    def _leaked(response) -> bool:
        """True si la respuesta trae una tool escrita como texto y ninguna llamada real."""
        return not response.tool_calls and TOOL_TEXT_MARKER in str(response.content)
