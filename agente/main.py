import logging
import os
import sys
import requests
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
from src.services.search_fuzzy import FuzzySearch
from src.services.uploader_image import ImageUploader
from src.services.client_inventory import InventoryClient
from src.services.search_inventory import InventorySearch

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class InventoryAgentApp:
    """Cablea el backend, las tools y el agente, y lo expone por CLI, API Flask o bot de Telegram."""

    def __init__(self) -> None:
        self._api = Backend(os.environ["BACKEND_URL"])
        self._login()
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
        self._chat = AgentChat(agent)

    def run(self) -> None:
        modes = {"cli": self._run_cli, "server": self._run_server, "telegram": self._run_telegram}
        mode = next((arg for arg in sys.argv[1:] if arg in modes), os.getenv("MODE", "cli"))
        modes[mode]()

    def _login(self) -> None:
        username = os.getenv("INVENTARIO_USER", "")
        password = os.getenv("INVENTARIO_PASS", "")
        if username and password:
            self._connect(username, password)
        else:
            print("Sin credenciales (INVENTARIO_USER / INVENTARIO_PASS). Solicitudes sin auth.")

    def _connect(self, username: str, password: str) -> None:
        """Inicia sesión; si el backend aún no responde, sigue y la sesión se abre en la primera petición."""
        try:
            self._api.login(username, password)
        except requests.ConnectionError:
            print("Backend sin respuesta todavía; la sesión se iniciará en la primera petición.")
            return
        print("Sesión iniciada correctamente.")

    def _run_server(self) -> None:
        from src.api.server_api import ApiServer
        port = int(os.getenv("PORT", "5000"))
        print(f"Servidor Flask escuchando en :{port}")
        ApiServer(self._chat, self._api).app.run(host="0.0.0.0", port=port)

    def _run_telegram(self) -> None:
        bot = (
            TelegramBotBuilder()
            .with_token(os.environ["TELEGRAM_TOKEN"])
            .with_handlers(BotHandlers(self._chat, self._api))
            .build()
        )
        print("Bot de Telegram iniciado.")
        bot.run_polling()

    def _run_cli(self) -> None:
        print("Agente de inventario listo. Escribe 'salir' para terminar.\n")
        while True:
            try:
                user_input = input("Tú: ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if not user_input or user_input.lower() in ("salir", "exit", "quit"):
                break
            reply, images = self._chat.ask(user_input)
            print(f"Agente: {reply or f'[{len(images)} imagen(es) generada(s)]'}\n")


if __name__ == "__main__":
    InventoryAgentApp().run()
