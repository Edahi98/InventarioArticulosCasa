import asyncio
import io
import logging
from telegram import Update, InputMediaPhoto
from telegram.ext import ContextTypes
from ..infrastructure.agent_client import AgentClient

logger = logging.getLogger(__name__)
MAX_GROUP = 10


async def _send_images(update: Update, images: list[bytes]) -> None:
    if not images:
        return
    if len(images) == 1:
        await update.message.reply_photo(photo=io.BytesIO(images[0]))
        return
    for i in range(0, len(images), MAX_GROUP):
        chunk = images[i:i + MAX_GROUP]
        media = [InputMediaPhoto(media=io.BytesIO(img)) for img in chunk]
        await update.message.reply_media_group(media=media)


def build_text_handler(agent: AgentClient):
    async def handle_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        thinking = await update.message.reply_text("⏳ Procesando...")
        logger.info("chat → %s", update.message.text[:80])
        try:
            response = await asyncio.to_thread(agent.chat, update.message.text.strip())
        except Exception as e:
            logger.exception("Error en agent.chat")
            await thinking.edit_text(f"Error al contactar al agente: {e}")
            return

        logger.info("reply=%r  images=%d", response.reply[:80] if response.reply else "", len(response.images))
        if response.reply:
            await thinking.edit_text(response.reply)
        else:
            await thinking.delete()

        await _send_images(update, response.images)

    return handle_text
