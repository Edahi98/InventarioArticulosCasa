import asyncio
import io
import logging

import requests
from pydantic import ValidationError
from telegram import InputMediaPhoto, Update
from telegram.ext import ContextTypes

from src.agent.chat_agent import AgentChat
from src.backend import Backend
from src.constantes.constantes_bot import (
    LINK_REQUIRED,
    LINKED,
    LINKING,
    LOGGED_OUT,
    MAX_ALBUM,
    NOT_LINKED,
    PHOTO_WITHOUT_CAPTION,
    PHOTO_WITH_CAPTION,
    PROCESSING,
    UPLOADING,
    WELCOME,
)
from src.decorators.decorator_dto_validator import DtoValidator
from src.dtos.dto_bot_session import BotSessionDto
from src.dtos.dto_chat import ChatDto
from src.dtos.dto_link_code import LinkCodeDto
from src.dtos.dto_upload import UploadDto
from src.errors.error_backend import BackendError
from src.errors.error_filtro import InstructionRejected
from src.services.context_auth import AuthContext
from src.services.gate_instruction import InstructionGate
from src.services.session_bot import BotSessions

logger = logging.getLogger(__name__)


class BotHandlers:
    """
    Handlers de Telegram. El bot no inicia sesión: la persona vincula su cuenta con un código que genera en la
    página web, y cada mensaje se atiende con el token que el backend entregó al canjearlo.
    """

    def __init__(
        self, chat: AgentChat, api: Backend, sessions: BotSessions, gate: InstructionGate, web_url: str
    ) -> None:
        self._chat = chat
        self._gate = gate
        self._api = api
        self._sessions = sessions
        self._web_url = web_url

    async def start(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        if ctx.args:
            await self._link(update, " ".join(ctx.args))
            return
        await update.message.reply_text(WELCOME.format(web_url=self._web_url))

    async def link(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        await self._link(update, " ".join(ctx.args or []))

    async def logout(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        session = self._sessions.drop(update.effective_user.id)
        if session is None:
            await update.message.reply_text(NOT_LINKED)
            return
        try:
            await asyncio.to_thread(self._api.logout, session.token)
        except (BackendError, requests.RequestException):
            logger.warning("No se pudo cerrar la sesión en el backend; el token vence solo")
        await update.message.reply_text(LOGGED_OUT)

    async def text(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        session = await self._session_or_prompt(update)
        if session is None:
            return
        thinking = await update.message.reply_text(PROCESSING)
        chat = await self._valid(thinking, ChatDto, message=update.message.text or "")
        if chat is None or not await self._allowed(update, thinking, chat.message):
            return
        await self._answer(update, thinking, chat.message, session.token)

    async def photo(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        session = await self._session_or_prompt(update)
        if session is None:
            return
        thinking = await update.message.reply_text(UPLOADING)
        try:
            photo = update.message.photo[-1]
            tg_file = await ctx.bot.get_file(photo.file_id)
            data = bytes(await tg_file.download_as_bytearray())
            upload = await self._valid(thinking, UploadDto, filename=f"{photo.file_id}.jpg",
                                       content_type="image/jpeg", data=data)
            if upload is None:
                return
            url = await asyncio.to_thread(self._upload_as, session.token, upload.data, upload.filename)
        except Exception as e:
            logger.exception("Error subiendo la foto")
            await thinking.edit_text(f"Error al procesar la imagen: {e}")
            return

        await thinking.edit_text(PROCESSING)
        caption = (update.message.caption or "").strip()
        if caption and await self._valid(thinking, ChatDto, message=caption) is None:
            return
        if caption and not await self._allowed(update, thinking, caption):
            return
        template = {True: PHOTO_WITH_CAPTION, False: PHOTO_WITHOUT_CAPTION}[bool(caption)]
        await self._answer(update, thinking, template.format(caption=caption, url=url), session.token)

    async def _link(self, update: Update, code: str) -> None:
        """Canjea el código en el backend y guarda la sesión de esta persona de Telegram."""
        thinking = await update.message.reply_text(LINKING)
        dto = await self._valid(thinking, LinkCodeDto, code=code)
        if dto is None:
            return
        try:
            session = BotSessionDto.model_validate(await asyncio.to_thread(self._api.claim_link_code, dto.code))
        except (BackendError, requests.RequestException, ValidationError) as e:
            await thinking.edit_text(f"No pude vincular tu cuenta: {e}")
            return

        self._sessions.link(update.effective_user.id, session)
        await self._delete_quietly(update.message)
        await thinking.edit_text(LINKED.format(username=session.username))

    async def _session_or_prompt(self, update: Update) -> BotSessionDto | None:
        """La sesión vinculada de esta persona; si no la tiene, le explica cómo vincular y retorna None."""
        session = self._sessions.get(update.effective_user.id)
        if session is None:
            await update.message.reply_text(LINK_REQUIRED.format(web_url=self._web_url))
        return session

    @staticmethod
    async def _delete_quietly(message) -> None:
        try:
            await message.delete()
        except Exception:
            logger.info("No se pudo borrar el mensaje con el código")

    @staticmethod
    async def _valid(thinking, dto, **data):
        """Valida la entrada con el DTO; si no es válida avisa en el mismo mensaje y devuelve None."""
        try:
            return dto.model_validate(data)
        except ValidationError as error:
            await thinking.edit_text(DtoValidator.describe(error))
            return None

    async def _allowed(self, update: Update, thinking, message: str) -> bool:
        """Pregunta al filtro si el mensaje es de inventario; si no, avisa en el mismo mensaje y retorna False."""
        try:
            await asyncio.to_thread(self._gate.review, f"tg:{update.effective_user.id}", message)
        except InstructionRejected as rejected:
            await thinking.edit_text(str(rejected))
            return False
        return True

    def _ask_as(self, token: str, message: str):
        with AuthContext.as_user(token):
            return self._chat.ask(message)

    def _upload_as(self, token: str, data: bytes, filename: str) -> str:
        with AuthContext.as_user(token):
            return self._api.upload_image(data, filename)

    async def _answer(self, update: Update, thinking, message: str, token: str) -> None:
        try:
            reply, images = await asyncio.to_thread(self._ask_as, token, message)
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
