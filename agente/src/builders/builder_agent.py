from langchain_openrouter import ChatOpenRouter
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from src.agent.edge_router import ToolRouter
from src.agent.node_model import ModelNode
from src.constantes.constantes_agente import (
    DEFAULT_OPENROUTER_MODEL,
    FINAL_HINT,
    NODE_FINAL,
    NODE_MODEL,
    NODE_TOOLS,
)


class AgentBuilder:
    """
    Builder fluent del agente como grafo: nodo del modelo, nodo de tools y nodo de respuesta final, unidos por
    aristas y por aristas condicionales que permiten encadenar varias tools antes de responder.
    """

    def __init__(self) -> None:
        self._model = DEFAULT_OPENROUTER_MODEL
        self._api_key = ""
        self._tools: list = []

    def with_model(self, model: str, api_key: str) -> "AgentBuilder":
        self._model, self._api_key = model, api_key
        return self

    def with_tools(self, tools: list) -> "AgentBuilder":
        self._tools = tools
        return self

    def build(self):
        llm = ChatOpenRouter(model=self._model, api_key=self._api_key)
        return self._graph(llm).compile()

    def _graph(self, llm) -> StateGraph:
        router = ToolRouter()
        graph = StateGraph(MessagesState)
        graph.add_node(NODE_MODEL, ModelNode(llm.bind_tools(self._tools)))
        graph.add_node(NODE_TOOLS, ToolNode(self._tools))
        graph.add_node(NODE_FINAL, ModelNode(llm, FINAL_HINT))
        graph.add_edge(START, NODE_MODEL)
        graph.add_conditional_edges(NODE_MODEL, router.after_model, [NODE_TOOLS, END])
        graph.add_conditional_edges(NODE_TOOLS, router.after_tools, [NODE_MODEL, NODE_FINAL])
        graph.add_edge(NODE_FINAL, END)
        return graph
