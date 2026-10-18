import ast
import base64
import html
import json
import re
import unicodedata

from src.constantes.constantes_bot import (
    HTML_CODE_SPAN,
    HTML_MARKS,
    HTML_QUOTE_BLOCK,
    HTML_QUOTE_PREFIX,
    HTML_TAG,
)


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

    @classmethod
    def telegram_html(cls, text: str) -> str:
        """
        Marcas simples del texto (**negrita**, *cursiva*, ~~tachado~~, ||secreto||, `código` y renglones con >) a
        HTML de Telegram. Escapa &, < y > primero; si las etiquetas quedaran mal anidadas, devuelve solo el texto
        escapado para que Telegram no rechace el mensaje.
        """
        escaped = html.escape(text, quote=False)
        parts = re.split(HTML_CODE_SPAN, escaped)
        converted = "".join(cls._mark_part(part, n % 2 == 1) for n, part in enumerate(parts))
        quoted = re.sub(HTML_QUOTE_BLOCK, cls._quote, converted)
        return quoted if cls._balanced(quoted) else escaped

    @staticmethod
    def _mark_part(part: str, is_code: bool) -> str:
        """Un tramo del texto: un fragmento de código se envuelve en `<code>`; el resto recibe las marcas."""
        if is_code:
            return f"<code>{part[1:-1]}</code>"
        for pattern, template in HTML_MARKS:
            part = re.sub(pattern, template, part)
        return part

    @staticmethod
    def _quote(match: re.Match) -> str:
        """Un bloque de renglones que empiezan con > a una cita de Telegram."""
        block = match.group(0)
        body = re.sub(HTML_QUOTE_PREFIX, "", block.rstrip("\n"))
        return f"<blockquote>{body}</blockquote>{block[len(block.rstrip(chr(10))):]}"

    @staticmethod
    def _balanced(text: str) -> bool:
        """True si todas las etiquetas de formato abren y cierran en orden."""
        stack: list[str] = []
        for closing, tag in re.findall(HTML_TAG, text):
            if not closing:
                stack.append(tag)
            elif not stack or stack.pop() != tag:
                return False
        return not stack

    @staticmethod
    def parse(content: str):
        """Contenido de un ToolMessage (JSON o literal de Python) a su valor nativo; si no es ninguno, el mismo texto."""
        for parse in (json.loads, ast.literal_eval):
            try:
                return parse(content)
            except (ValueError, SyntaxError, TypeError):
                pass
        return content
