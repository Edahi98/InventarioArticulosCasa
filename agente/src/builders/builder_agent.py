from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from src.agent.edge_router import ToolRouter
from src.agent.node_model import ModelNode
from src.constantes.constantes_agente import (
    FINAL_HINT,
    NODE_FINAL,
    NODE_MODEL,
    NODE_TOOLS,
    TOOLS_REMINDER,
)


class AgentBuilder:
    """
    Builder fluent del agente como grafo: nodo del modelo, nodo de tools y nodo de respuesta final, unidos por
    aristas y por aristas condicionales que permiten encadenar varias tools antes de responder.
    """

    def __init__(self) -> None:
        self._llm = None
        self._tools: list = []

    def with_llm(self, llm) -> "AgentBuilder":
        self._llm = llm
        return self

    def with_tools(self, tools: list) -> "AgentBuilder":
        self._tools = tools
        return self

    def build(self):
        return self._graph(self._llm).compile()

    def _graph(self, llm) -> StateGraph:
        router = ToolRouter()
        graph = StateGraph(MessagesState)
        graph.add_node(NODE_MODEL, ModelNode(llm.bind_tools(self._tools), self._reminder()))
        graph.add_node(NODE_TOOLS, ToolNode(self._tools))
        graph.add_node(NODE_FINAL, ModelNode(llm, FINAL_HINT))
        graph.add_edge(START, NODE_MODEL)
        graph.add_conditional_edges(NODE_MODEL, router.after_model, [NODE_TOOLS, NODE_FINAL, END])
        graph.add_conditional_edges(NODE_TOOLS, router.after_tools, [NODE_MODEL, NODE_FINAL])
        graph.add_edge(NODE_FINAL, END)
        return graph

    def _reminder(self) -> str:
        """Recordatorio con los nombres exactos de las tools para que el modelo no invente otras."""
        return TOOLS_REMINDER.format(names=", ".join(tool.name for tool in self._tools))
