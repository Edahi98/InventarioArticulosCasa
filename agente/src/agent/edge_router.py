from itertools import takewhile

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, ToolMessage
from langgraph.graph import END, MessagesState

from src.constantes.constantes_agente import CHOICE_KEY, MAX_TOOL_STEPS, NODE_FINAL, NODE_MODEL, NODE_TOOLS


class ToolRouter:
    """Aristas condicionales del grafo: deciden si se encadena otra tool, se vuelve al modelo o se cierra."""

    def after_model(self, state: MessagesState) -> str:
        """
        Si el modelo pidió tools va al nodo de tools; si respondió con texto, termina. Si terminó sin escribir
        nada después de usar tools, pasa a la respuesta final para que él mismo cuente lo que hizo.
        """
        last = state["messages"][-1]
        if getattr(last, "tool_calls", None):
            return NODE_TOOLS
        silent = not str(last.content).strip() and self._steps(state["messages"]) > 0
        return NODE_FINAL if silent else END

    def after_tools(self, state: MessagesState) -> str:
        """
        Con las tools ya resueltas vuelve al modelo (puede encadenar otra). Va a la respuesta final, sin más
        tools, si alguna pidió a la persona elegir entre varias opciones o si se llegó al tope de rondas.
        """
        messages = state["messages"]
        waiting = self._asks_choice(messages) or self._steps(messages) >= MAX_TOOL_STEPS
        return NODE_FINAL if waiting else NODE_MODEL

    @staticmethod
    def _asks_choice(messages: list[AnyMessage]) -> bool:
        """Si alguna tool de la última ronda devolvió una petición de elegir entre varias coincidencias."""
        latest = takewhile(lambda m: isinstance(m, ToolMessage), reversed(messages))
        return any(CHOICE_KEY in str(m.content) for m in latest)

    @staticmethod
    def _steps(messages: list[AnyMessage]) -> int:
        """Rondas de tools que el modelo lleva en el turno actual (desde el último mensaje de la persona)."""
        turn = takewhile(lambda m: not isinstance(m, HumanMessage), reversed(messages))
        return sum(1 for m in turn if isinstance(m, AIMessage) and m.tool_calls)
