import ast
import base64
import json
import unicodedata


class Codec:
    """Conversión de datos entre representaciones (texto, base64, valores nativos)."""

    @staticmethod
    def to_base64(data: bytes) -> str:
        """Bytes a string base64, listo para viajar en JSON."""
        return base64.b64encode(data).decode()

    @staticmethod
    def strip_accents(text: str) -> str:
        """Quita tildes y diéresis (la fuente integrada de Pillow no tiene esos glifos)."""
        decomposed = unicodedata.normalize("NFKD", text)
        return "".join(c for c in decomposed if not unicodedata.combining(c))

    @staticmethod
    def parse(content: str):
        """Contenido de un ToolMessage (JSON o literal de Python) a su valor nativo; si no es ninguno, el mismo texto."""
        for parse in (json.loads, ast.literal_eval):
            try:
                return parse(content)
            except (ValueError, SyntaxError, TypeError):
                pass
        return content
