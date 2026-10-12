from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BotSessionDto(BaseModel):
    """Sesión que entrega el backend al canjear un código: token del usuario, vencimiento y nombre."""

    model_config = ConfigDict(extra="ignore")

    token: str = Field(min_length=1)
    expires_at: datetime = Field(alias="expiresAt")
    username: str = Field(min_length=1)
