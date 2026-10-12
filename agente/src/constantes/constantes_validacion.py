NAME_PATTERN = r"^[\p{L}\p{N}][\p{L}\p{N} .,()\-_/&+:]{0,99}$"
TEXT_PATTERN = r"^[^<>{}\\`$|\x00-\x08\x0b\x0c\x0e-\x1f]*$"
URL_PATTERN = r"^(https?://[A-Za-z0-9.\-_~:/?#\[\]@!$&()*+,=%]+)?$"
FILENAME_PATTERN = r"(?i)^[\p{L}\p{N}_\- .]{1,100}\.(jpe?g|png|webp|gif)$"

MAX_NAME = 100
MAX_TEXT = 500
MAX_TITLE = 150
MAX_MESSAGE = 2000
MAX_URL = 2048
MAX_STOCK = 1_000_000
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

IMAGE_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp", "image/gif")

IMAGE_SIGNATURES = (
    b"\xff\xd8\xff",
    b"\x89PNG\r\n\x1a\n",
    b"GIF87a",
    b"GIF89a",
    b"RIFF",
)

SCRIPT_PATTERNS = (
    r"<\s*/?\s*(script|iframe|object|embed|svg|img|style|link|meta|form|body|html|base)\b",
    r"\b(java|vb)script\s*:",
    r"\bdata\s*:\s*text/html",
    r"\bon(error|load|click|dblclick|mouse\w+|key\w+|focus|blur|change|submit|input|toggle|"
    r"pointer\w+|animation\w+|begin|abort|unload|resize|scroll)\s*=",
    r"\b(eval|alert|prompt|confirm|atob|settimeout|setinterval)\s*\(",
    r"\bdocument\s*\.\s*(cookie|write|location|domain)",
    r"\bwindow\s*\.\s*(location|open)",
    r"&#x?[0-9a-f]+;?",
    r"%3c\s*/?\s*script",
)

SQL_PATTERNS = (
    r"\bunion\b\s+(all\s+)?select\b",
    r"\bselect\b[\s\S]{1,80}\bfrom\b",
    r"\b(insert\s+into|delete\s+from|drop\s+(table|database|schema|view)|truncate\s+table|"
    r"alter\s+table|create\s+(table|database))\b",
    r"\bupdate\b\s+[\w.\"`]+\s+set\b",
    r";\s*(select|insert|update|delete|drop|alter|truncate|exec|create|shutdown)\b",
    r"\b(exec|execute)\b\s*(\(|xp_|sp_)",
    r"['\"]\s*(or|and)\s+['\"\d\w]+\s*(=|like)\s*['\"\d\w]+",
    r"\b(or|and)\b\s+\d+\s*=\s*\d+",
    r"/\*[\s\S]*?\*/",
    r"--\s|--$",
    r"\b(waitfor\s+delay|sleep\s*\(\s*\d+|benchmark\s*\(|pg_sleep\s*\()",
    r"\b(xp_cmdshell|information_schema|pg_catalog|sqlite_master)\b",
)

INJECTION_MESSAGE = "contiene código no permitido (HTML, script o SQL)"

ERROR_MESSAGES = {
    "missing": "es obligatorio",
    "string_pattern_mismatch": "tiene caracteres que no se permiten",
    "string_too_short": "no puede estar vacío",
    "string_too_long": "es demasiado largo",
    "int_parsing": "debe ser un número entero",
    "int_from_float": "debe ser un número entero",
    "bool_parsing": "debe ser verdadero o falso",
    "greater_than_equal": "es menor que el mínimo permitido",
    "greater_than": "es menor que el mínimo permitido",
    "less_than_equal": "supera el máximo permitido",
    "extra_forbidden": "no es un campo esperado",
    "literal_error": "tiene un valor que no se permite",
    "bytes_too_long": "supera el tamaño máximo",
    "bytes_too_short": "está vacío",
}
DEFAULT_ERROR_MESSAGE = "no es válido"
