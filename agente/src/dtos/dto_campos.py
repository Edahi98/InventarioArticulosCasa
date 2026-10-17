from typing import Annotated

from pydantic import Field, StringConstraints

from src.constantes.constantes_validacion import (
    MAX_MESSAGE,
    MAX_NAME,
    MAX_STOCK,
    MAX_TEXT,
    MAX_TITLE,
    MAX_URL,
    NAME_PATTERN,
    TEXT_PATTERN,
    URL_PATTERN,
)

SafeName = Annotated[str, StringConstraints(min_length=1, max_length=MAX_NAME, pattern=NAME_PATTERN)]
SafeTitle = Annotated[str, StringConstraints(min_length=1, max_length=MAX_TITLE, pattern=TEXT_PATTERN)]
SafeText = Annotated[str, StringConstraints(max_length=MAX_TEXT, pattern=TEXT_PATTERN)]
SafeLocation = Annotated[str, StringConstraints(max_length=MAX_NAME, pattern=TEXT_PATTERN)]
SafeMessage =Annotated[str, StringConstraints(min_length=1, max_length=MAX_MESSAGE, pattern=TEXT_PATTERN)]
SafeUrl = Annotated[str, StringConstraints(max_length=MAX_URL, pattern=URL_PATTERN)]
SafeStock = Annotated[int, Field(ge=0, le=MAX_STOCK)]
