import logging

import requests
from langchain_core.messages import ToolMessage
from langgraph.pregel import Pregel as CompiledGraph

from src.constantes.constantes_agente import CHOICE_KEY, QUESTION_FRAME
from src.constantes.constantes_filtro import ASKS_THRESHOLD, QUESTION_MARKS
from src.errors.error_filtro import DecisionsError
from src.services.client_decisions import DecisionsClient
from src.services.images.renderer_image import CardImageRenderer
from src.services.memory_choice import ChoiceMemory
from src.services.memory_focus import FocusMemory
from src.services.memory_question import QuestionMemory
from src.utilerias.util_codec import Codec


logger = logging.getLogger(__name__)

DELETE_PREFIX = "eliminar"


class AgentChat:
    """
    Conversa con el agente y traduce lo que devuelven sus tools a texto o fichas (PNG). Recuerda por persona
    el artículo o la categoría del último mensaje para anteponerlo al siguiente.
    """

    def __init__(
        self, agent: CompiledGraph, decisions: DecisionsClient, questions: QuestionMemory, choices: ChoiceMemory
    ) -> None:
        self._agent = agent
        self._decisions = decisions
        self._questions = questions
        self._choices = choices
        self._renderer = CardImageRenderer()
        self._focus = FocusMemory()

    def ask(self, message: str, key: str) -> tuple[str, list[bytes]]:
        """
        Respuesta del agente: (texto del modelo, imágenes PNG de las fichas). Una sola petición al modelo.
        `key` identifica a la persona (tg:<id>, api:<sub> o cli) para recordar de qué se estaba hablando.
        """
        framed = self._frame(key, message)
        self._choices.clear(key)
        result = self._agent.invoke({"messages": [{"role": "user", "content": framed}]})
        messages = result["messages"]
        self._questions.clear(key)
        self._learn_question(key, messages[-1].content)
        tools = [m for m in messages if isinstance(m, ToolMessage)]
        logger.info("tools usadas: %s", [m.name for m in tools] or "ninguna")
        results = [Codec.parse(m.content) for m in tools]
        self._offer_choice(key, message, results)
        self._remember(key, tools, results)
        images = self._renderer.render(results)
        return messages[-1].content, images

    def forget(self, key: str) -> None:
        """Olvida el contexto de esa persona (al cerrar sesión)."""
        self._focus.forget(key)
        self._questions.clear(key)
        self._choices.clear(key)

    def _offer_choice(self, key: str, message: str, results: list) -> None:
        """Si alguna tool no pudo decidir entre varios registros, guarda las opciones para que la persona elija."""
        requests_ = [r[CHOICE_KEY] for r in results if isinstance(r, dict) and CHOICE_KEY in r]
        if requests_:
            self._choices.offer(key, message, requests_[0]["resource"], requests_[0]["options"])

    def _frame(self, key: str, message: str) -> str:
        """El mensaje con el contexto vigente: la pregunta que se le hizo a la persona y de qué se hablaba."""
        framed = self._focus.frame(key, message)
        pending = self._questions.pending(key)
        return framed if pending is None else f"{QUESTION_FRAME.format(question=pending)}\n{framed}"

    def _learn_question(self, key: str, reply: str) -> None:
        """
        Si la respuesta del asistente le pide un dato a la persona, la guarda para su siguiente mensaje. Solo
        consulta a decisions cuando el texto trae signos de pregunta; si la consulta falla, no guarda nada.
        """
        if not any(mark in reply for mark in QUESTION_MARKS):
            return
        try:
            asks = self._decisions.asks_score(reply) >= ASKS_THRESHOLD
        except (requests.RequestException, DecisionsError):
            logger.warning("No se pudo clasificar la respuesta como pregunta")
            return
        if asks:
            self._questions.remember(key, reply)

    def _remember(self, key: str, tools: list[ToolMessage], results: list) -> None:
        """Recuerda lo de este turno, salvo lo eliminado; si se eliminó algo, el contexto anterior ya no sirve."""
        if any((m.name or "").startswith(DELETE_PREFIX) for m in tools):
            self._focus.forget(key)
        kept = [r for m, r in zip(tools, results) if not (m.name or "").startswith(DELETE_PREFIX)]
        self._focus.remember(key, kept)
