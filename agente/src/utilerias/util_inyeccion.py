import re
import unicodedata

from src.constantes.constantes_validacion import SCRIPT_PATTERNS, SQL_PATTERNS


class Injection:
    """Detecta intentos de inyección de JavaScript/HTML y SQL en texto que llega de fuera."""

    _SCRIPT = re.compile("|".join(f"(?:{p})" for p in SCRIPT_PATTERNS), re.IGNORECASE)
    _SQL = re.compile("|".join(f"(?:{p})" for p in SQL_PATTERNS), re.IGNORECASE)

    @staticmethod
    def normalize(text: str) -> str:
        """Pasa a NFKC para que variantes de ancho completo (＜script＞) no esquiven los patrones."""
        return unicodedata.normalize("NFKC", text)

    @classmethod
    def detect(cls, text: str) -> bool:
        """True si el texto contiene un patrón de script o de SQL."""
        normalized = cls.normalize(text)
        return bool(cls._SCRIPT.search(normalized) or cls._SQL.search(normalized))
