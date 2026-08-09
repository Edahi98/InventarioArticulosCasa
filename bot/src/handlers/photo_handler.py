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


def build_photo_handler(agent: AgentClient):
    async def handle_photo(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        thinking = await update.message.reply_text("⏳ Subiendo imagen...")

        photo = update.message.photo[-1]
        tg_file = await ctx.bot.get_file(photo.file_id)
        image_bytes = bytes(await tg_file.download_as_bytearray())
        caption = (update.message.caption or "").strip()
        logger.info("foto recibida  file_id=%s  caption=%r", photo.file_id, caption)

        try:
            image_url = await asyncio.to_thread(agent.upload_image, image_bytes, f"{photo.file_id}.jpg")
            logger.info("imagen subida → %s", image_url)

            await thinking.edit_text("⏳ Procesando...")

            message = (
                f"{caption}\n\n"
                f"Imagen subida. Usa image_url=\"{image_url}\" en la herramienta correspondiente."
                if caption else
                f"El usuario envió una imagen. image_url=\"{image_url}\". "
                "Pregúntale para qué artículo o categoría es, y cuando actúes usa ese image_url."
            )

            response = await asyncio.to_thread(agent.chat, message)
        except Exception as e:
            logger.exception("Error procesando foto")
            await thinking.edit_text(f"Error al procesar la imagen: {e}")
            return

        logger.info("reply=%r  images=%d", response.reply[:80] if response.reply else "", len(response.images))
        if response.reply:
            await thinking.edit_text(response.reply)
        else:
            await thinking.delete()

        await _send_images(update, response.images)

    return handle_photo
