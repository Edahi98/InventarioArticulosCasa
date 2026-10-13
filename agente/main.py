import logging
import os
import sys
from dotenv import load_dotenv

from src.agent.chat_agent import AgentChat
from src.agent.toolkit_image import ImageToolkit
from src.agent.toolkit_search import SearchToolkit
from src.agent.toolkit_inventory import AgentToolkit
from src.backend import Backend
from src.bot.handlers_bot import BotHandlers
from src.builders.builder_agent import AgentBuilder
from src.builders.builder_telegram_bot import TelegramBotBuilder
from src.constantes.constantes_agente import DEFAULT_OPENROUTER_MODEL
from src.constantes.constantes_filtro import DEFAULT_DECISIONS_MODEL
from src.errors.error_filtro import InstructionRejected
from src.services.client_decisions import DecisionsClient
from src.services.gate_instruction import InstructionGate
from src.services.memory_question import QuestionMemory
from src.constantes.constantes_auth import DEFAULT_JWT_ISSUER, JWKS_PATH
from src.services.context_auth import AuthContext
from src.services.search_fuzzy import FuzzySearch
from src.services.session_bot import BotSessions
from src.services.uploader_image import ImageUploader
from src.services.verifier_jwt import TokenVerifier
from src.services.client_inventory import InventoryClient
from src.services.search_inventory import InventorySearch

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class InventoryAgentApp:
    """
    Cablea el backend, las tools y el agente, y lo expone por CLI, API Flask o bot de Telegram.
    El agente no inicia sesión: siempre actúa con el token que el usuario obtuvo en la página web.
    """

    def __init__(self) -> None:
        self._api = Backend(os.environ["BACKEND_URL"])
        inventory, search = InventoryClient(self._api), FuzzySearch()
        tools = [
            *AgentToolkit(inventory, search).tools(),
            *SearchToolkit(InventorySearch(inventory, search)).tools(),
            *ImageToolkit(ImageUploader(inventory)).tools(),
        ]
        agent = (
            AgentBuilder()
            .with_model(os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL), os.environ["OPENROUTER_API_KEY"])
            .with_tools(tools)
            .build()
        )
        decisions = DecisionsClient(
            os.environ["OPENROUTER_API_KEY"], os.getenv("DECISIONS_MODEL", DEFAULT_DECISIONS_MODEL)
        )
        questions = QuestionMemory()
        self._chat = AgentChat(agent, decisions, questions)
        self._gate = InstructionGate(decisions, questions)

    def run(self) -> None:
        modes = {"cli": self._run_cli, "server": self._run_server, "telegram": self._run_telegram}
        mode = next((arg for arg in sys.argv[1:] if arg in modes), os.getenv("MODE", "cli"))
        modes[mode]()

    def _run_server(self) -> None:
        from src.api.server_api import ApiServer
        port = int(os.getenv("PORT", "5000"))
        print(f"Servidor Flask escuchando en :{port}")
        force_https = os.getenv("FORCE_HTTPS", "false").lower() == "true"
        jwks_url = os.environ["BACKEND_URL"].rstrip("/") + JWKS_PATH
        verifier = TokenVerifier(jwks_url, os.getenv("JWT_ISSUER", DEFAULT_JWT_ISSUER))
        ApiServer(self._chat, self._api, verifier, self._gate, force_https).app.run(host="0.0.0.0", port=port)

    def _run_telegram(self) -> None:
        handlers = BotHandlers(self._chat, self._api, BotSessions(), self._gate, os.getenv("WEB_URL", "la página web"))
        bot = TelegramBotBuilder().with_token(os.environ["TELEGRAM_TOKEN"]).with_handlers(handlers).build()
        print("Bot de Telegram iniciado.")
        bot.run_polling()

    def _run_cli(self) -> None:
        token = os.getenv("INVENTARIO_TOKEN", "")
        if not token:
            print("El modo CLI necesita un token: inicia sesión en la web y define INVENTARIO_TOKEN.")
            return

        print("Agente de inventario listo. Escribe 'salir' para terminar.\n")
        with AuthContext.as_user(token):
            while True:
                try:
                    user_input = input("Tú: ").strip()
                except (EOFError, KeyboardInterrupt):
                    break
                if not user_input or user_input.lower() in ("salir", "exit", "quit"):
                    break
                try:
                    self._gate.review("cli", user_input)
                except InstructionRejected as rejected:
                    print(f"Agente: {rejected}\n")
                    continue
                reply, images = self._chat.ask(user_input, "cli")
                print(f"Agente: {reply or f'[{len(images)} imagen(es) generada(s)]'}\n")


if __name__ == "__main__":
    InventoryAgentApp().run()
