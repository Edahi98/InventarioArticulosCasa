from langchain_core.messages import SystemMessage
from langgraph.graph import MessagesState

from src.constantes.constantes_agente import SYSTEM_PROMPT


class ModelNode:
    """Nodo del grafo: le pasa la conversación al modelo y agrega su respuesta (texto o llamadas a tools)."""

    def __init__(self, model, hint: str = "") -> None:
        self._model = model
        self._prompt = SystemMessage(content=f"{SYSTEM_PROMPT} {hint}".strip())

    def __call__(self, state: MessagesState) -> dict:
        response = self._model.invoke([self._prompt, *state["messages"]])
        return {"messages": [response]}
