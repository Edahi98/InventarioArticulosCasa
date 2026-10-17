from pydantic import Field

from src.constantes.constantes_checklist import MAX_CHECKLIST_ITEMS
from src.dtos.dto_base import DtoBase
from src.dtos.dto_campos import SafeTitle


class ChecklistItemsDto(DtoBase):
    """Cosas de una lista (ingredientes, materiales...) que se comparan con el inventario."""

    items: list[SafeTitle] = Field(min_length=1, max_length=MAX_CHECKLIST_ITEMS)
