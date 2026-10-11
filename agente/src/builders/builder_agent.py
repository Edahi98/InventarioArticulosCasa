from langchain_openrouter import ChatOpenRouter
from langgraph.prebuilt import create_react_agent

from src.constantes.constantes_agente import DEFAULT_OPENROUTER_MODEL, SYSTEM_PROMPT


class AgentBuilder:
    """Builder fluent del agente ReAct: modelo de OpenRouter y tools."""

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
        return create_react_agent(llm, self._tools, prompt=SYSTEM_PROMPT)
