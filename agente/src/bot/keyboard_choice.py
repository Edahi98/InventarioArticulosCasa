from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from src.constantes.constantes_bot import CHOICE_CALLBACK, CHOICE_LABEL_LIMIT


class ChoiceKeyboard:
    """Teclado en línea de Telegram con una opción por botón; cada botón envía `pick:<posición>`."""

    @classmethod
    def build(cls, options: list[dict]) -> InlineKeyboardMarkup:
        rows = [
            [InlineKeyboardButton(cls._label(option), callback_data=f"{CHOICE_CALLBACK}:{index}")]
            for index, option in enumerate(options)
        ]
        return InlineKeyboardMarkup(rows)

    @staticmethod
    def _label(option: dict) -> str:
        detail = f" · {option['detail']}" if option.get("detail") else ""
        return f"{option['name']}{detail}"[:CHOICE_LABEL_LIMIT]
