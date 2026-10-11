import asyncio
import io
import logging

from telegram import InputMediaPhoto, Update
from telegram.ext import ContextTypes

from src.agent.chat_agent import AgentChat
from src.backend import Backend
from src.constantes.constantes_bot import MAX_ALBUM, PHOTO_WITHOUT_CAPTION, PHOTO_WITH_CAPTION, PROCESSING, UPLOADING

logger = logging.getLogger(__name__)


class BotHandlers:
    """Handlers de Telegram: texto y fotos hacia el agente, y respuesta con texto o fichas."""

    def __init__(self, chat: AgentChat, api: Backend) -> None:
        self._chat = chat
        self._api = api

    async def text(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        thinking = await update.message.reply_text(PROCESSING)
        await self._answer(update, thinking, update.message.text.strip())

    async def photo(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        thinking = await update.message.reply_text(UPLOADING)
        try:
            photo = update.message.photo[-1]
            tg_file = await ctx.bot.get_file(photo.file_id)
            data = bytes(await tg_file.download_as_bytearray())
            url = await asyncio.to_thread(self._api.upload_image, data, f"{photo.file_id}.jpg")
        except Exception as e:
            logger.exception("Error subiendo la foto")
            await thinking.edit_text(f"Error al procesar la imagen: {e}")
            return

        await thinking.edit_text(PROCESSING)
        caption = (update.message.caption or "").strip()
        template = {True: PHOTO_WITH_CAPTION, False: PHOTO_WITHOUT_CAPTION}[bool(caption)]
        await self._answer(update, thinking, template.format(caption=caption, url=url))

    async def _answer(self, update: Update, thinking, message: str) -> None:
        try:
            reply, images = await asyncio.to_thread(self._chat.ask, message)
        except Exception as e:
            logger.exception("Error en el agente")
            await thinking.edit_text(f"Error al contactar al agente: {e}")
            return

        logger.info("reply=%r  images=%d", reply[:80], len(images))
        await (thinking.edit_text(reply) if reply else thinking.delete())
        for i in range(0, len(images), MAX_ALBUM):
            await self._send_album(update, images[i:i + MAX_ALBUM])

    @staticmethod
    async def _send_album(update: Update, images: list[bytes]) -> None:
        if len(images) == 1:
            await update.message.reply_photo(photo=io.BytesIO(images[0]))
            return
        await update.message.reply_media_group(media=[InputMediaPhoto(media=io.BytesIO(img)) for img in images])
