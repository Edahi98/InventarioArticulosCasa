import asyncio
import logging
import os
import sys
from dotenv import load_dotenv

from src.agent.chat_agent import AgentChat
from src.agent.toolkit_checklist import ChecklistToolkit
from src.agent.toolkit_image import ImageToolkit
from src.agent.toolkit_search import SearchToolkit
from src.agent.toolkit_inventory import AgentToolkit
from src.backend import Backend
from src.bot.handlers_bot import BotHandlers
from src.builders.builder_agent import AgentBuilder
from src.builders.builder_telegram_bot import TelegramBotBuilder
from src.constantes.constantes_filtro import DEFAULT_DECISIONS_MODEL
from src.errors.error_filtro import InstructionRejected
from src.services.adapter_llm import LlmAdapter
from src.services.client_decisions import DecisionsClient
from src.services.gate_instruction import InstructionGate
from src.services.memory_choice import ChoiceMemory
from src.services.memory_focus import FocusMemory
from src.services.memory_question import QuestionMemory
from src.constantes.constantes_auth import DEFAULT_JWT_ISSUER, JWKS_PATH
from src.services.context_auth import AuthContext
from src.services.search_fuzzy import FuzzySearch
from src.services.session_bot import BotSessions
from src.services.store_memory import StoreMemory
from src.services.store_postgres import StorePostgres
from src.services.uploader_image import ImageUploader
from src.services.verifier_jwt import TokenVerifier
from src.services.client_inventory import InventoryClient
from src.services.reader_page import PageReader
from src.services.review_checklist import ChecklistReview
from src.services.search_inventory import InventorySearch

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)


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
            *ChecklistToolkit(PageReader(self._api), ChecklistReview(self._api)).tools(),
        ]
        agent = (
            AgentBuilder()
            .with_llm(LlmAdapter.from_env())
            .with_tools(tools)
            .build()
        )
        decisions = DecisionsClient(
            os.getenv("OPENROUTER_API_KEY", ""), os.getenv("DECISIONS_MODEL", DEFAULT_DECISIONS_MODEL)
        )
        self._store = (
            StorePostgres(os.environ["STATE_DATABASE_URL"]) if os.getenv("STATE_DATABASE_URL") else StoreMemory()
        )
        questions = QuestionMemory(self._store)
        self._choices = ChoiceMemory(self._store)
        self._chat = AgentChat(agent, decisions, questions, self._choices, FocusMemory(self._store))
        self._gate = InstructionGate(decisions, questions, self._store)

    def run(self) -> None:
        modes = {
            "cli": self._run_cli,
            "server": self._run_server,
            "telegram": self._run_telegram,
            "webhook": self._run_webhook,
        }
        mode = next((arg for arg in sys.argv[1:] if arg in modes), os.getenv("MODE", "cli"))
        modes[mode]()

    def web_app(self):
        """App Flask (API y, si hay token y secreto de Telegram, el webhook); la usan el modo server y Vercel."""
        from src.api.server_api import ApiServer
        from src.api.webhook_telegram import TelegramWebhook
        force_https = os.getenv("FORCE_HTTPS", "false").lower() == "true"
        jwks_url = os.environ["BACKEND_URL"].rstrip("/") + JWKS_PATH
        verifier = TokenVerifier(jwks_url, os.getenv("JWT_ISSUER", DEFAULT_JWT_ISSUER))
        token, secret = os.getenv("TELEGRAM_TOKEN"), os.getenv("TELEGRAM_WEBHOOK_SECRET")
        webhook = TelegramWebhook(self._handlers(), token, secret) if token and secret else None
        return ApiServer(self._chat, self._api, verifier, self._gate, force_https, webhook).app

    def _handlers(self) -> BotHandlers:
        return BotHandlers(
            self._chat, self._api, BotSessions(self._store), self._gate, self._choices,
            os.getenv("WEB_URL", "la página web"),
        )

    def _run_server(self) -> None:
        port = int(os.getenv("PORT", "5000"))
        print(f"Servidor Flask escuchando en :{port}")
        self.web_app().run(host="0.0.0.0", port=port)

    def _run_telegram(self) -> None:
        bot = TelegramBotBuilder().with_token(os.environ["TELEGRAM_TOKEN"]).with_handlers(self._handlers()).build()
        print("Bot de Telegram iniciado.")
        bot.run_polling()

    def _run_webhook(self) -> None:
        """`main.py webhook <url>`: registra en Telegram la URL pública del webhook (con el secreto de la app)."""
        from src.api.webhook_telegram import TelegramWebhook
        url = next((arg for arg in sys.argv[1:] if arg.startswith("https://")), os.getenv("WEBHOOK_URL", ""))
        secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
        if not url or not secret:
            print("Faltan la URL (main.py webhook https://<dominio>/telegram/webhook) o TELEGRAM_WEBHOOK_SECRET.")
            return
        asyncio.run(TelegramWebhook.register(os.environ["TELEGRAM_TOKEN"], secret, url))
        print("Webhook registrado en Telegram.")

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
