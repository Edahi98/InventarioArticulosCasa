from telegram.ext import (
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from src.bot.handlers_bot import BotHandlers
from src.constantes.constantes_bot import CHOICE_PATTERN


class TelegramBotBuilder:
    """Builder fluent de la aplicación de Telegram: token, comandos de vinculación y handlers de mensajes."""

    def __init__(self) -> None:
        self._token = ""
        self._handlers: BotHandlers | None = None

    def with_token(self, token: str) -> "TelegramBotBuilder":
        self._token = token
        return self

    def with_handlers(self, handlers: BotHandlers) -> "TelegramBotBuilder":
        self._handlers = handlers
        return self

    def build(self) -> Application:
        app = ApplicationBuilder().token(self._token).build()
        app.add_handler(CommandHandler("start", self._handlers.start))
        app.add_handler(CommandHandler(["vincular", "link"], self._handlers.link))
        app.add_handler(CommandHandler(["salir", "logout"], self._handlers.logout))
        app.add_handler(CallbackQueryHandler(self._handlers.choose, pattern=CHOICE_PATTERN))
        app.add_handler(MessageHandler(filters.PHOTO, self._handlers.photo))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self._handlers.text))
        return app
