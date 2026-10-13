import asyncio
import hmac
import logging

from flask import jsonify, request
from telegram import Bot, Update

from src.builders.builder_telegram_bot import TelegramBotBuilder
from src.bot.handlers_bot import BotHandlers
from src.constantes.constantes_estado import WEBHOOK_HEADER, WEBHOOK_UPDATES

logger = logging.getLogger(__name__)


class TelegramWebhook:
    """
    Recibe las actualizaciones de Telegram por webhook (para funciones serverless, donde no hay un proceso
    permanente que haga polling). Cada petición debe traer el secreto que se registró con setWebhook.
    """

    def __init__(self, handlers: BotHandlers, token: str, secret: str) -> None:
        self._handlers = handlers
        self._token = token
        self._secret = secret

    def receive(self):
        """POST del webhook: valida el secreto, procesa la actualización y responde 200 aunque el handler falle."""
        given = request.headers.get(WEBHOOK_HEADER, "")
        if not hmac.compare_digest(given.encode(), self._secret.encode()):
            return jsonify({"error": "No autorizado."}), 403
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Actualización no válida."}), 400
        try:
            asyncio.run(self._process(data))
        except Exception:
            logger.exception("Error procesando la actualización de Telegram")
        return jsonify({"ok": True})

    async def _process(self, data: dict) -> None:
        app = TelegramBotBuilder().with_token(self._token).with_handlers(self._handlers).build()
        async with app:
            await app.process_update(Update.de_json(data, app.bot))

    @staticmethod
    async def register(token: str, secret: str, url: str) -> None:
        """Le dice a Telegram que envíe las actualizaciones a `url` con el secreto."""
        async with Bot(token) as bot:
            await bot.set_webhook(url=url, secret_token=secret, allowed_updates=WEBHOOK_UPDATES)
