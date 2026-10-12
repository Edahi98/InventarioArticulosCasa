from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeMessage


class ChatDto(DtoBase):
    """Mensaje de texto que llega al agente por /chat o por Telegram."""

    message: SafeMessage
