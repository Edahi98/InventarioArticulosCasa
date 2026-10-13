from itertools import takewhile

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage
from langgraph.graph import END, MessagesState

from src.constantes.constantes_agente import MAX_TOOL_STEPS, NODE_FINAL, NODE_MODEL, NODE_TOOLS


class ToolRouter:
    """Aristas condicionales del grafo: deciden si se encadena otra tool, se vuelve al modelo o se cierra."""

    def after_model(self, state: MessagesState) -> str:
        """Si el modelo pidió tools va al nodo de tools; si respondió con texto, termina."""
        return NODE_TOOLS if getattr(state["messages"][-1], "tool_calls", None) else END

    def after_tools(self, state: MessagesState) -> str:
        """Con las tools ya resueltas vuelve al modelo (puede encadenar otra) o, al llegar al tope, a la respuesta final."""
        return NODE_FINAL if self._steps(state["messages"]) >= MAX_TOOL_STEPS else NODE_MODEL

    @staticmethod
    def _steps(messages: list[AnyMessage]) -> int:
        """Rondas de tools que el modelo lleva en el turno actual (desde el último mensaje de la persona)."""
        turn = takewhile(lambda m: not isinstance(m, HumanMessage), reversed(messages))
        return sum(1 for m in turn if isinstance(m, AIMessage) and m.tool_calls)
