import re

from src.backend import Backend
from src.constantes.constantes_checklist import (
    FALLBACK_SOURCES,
    MAX_CHECKLIST_ITEMS,
    MAX_ITEM_LENGTH,
    MAX_PAGE_LISTS,
    MAX_PAGE_TITLE,
    MIN_HEADING_LEVEL,
    MIN_USEFUL_ITEMS,
    PAGE_DATA_NOTE,
    PAGE_TITLE_SEPARATOR,
    QUANTITY_START,
)
from src.constantes.constantes_red import SCRAPE_PATH, SCRAPE_TIMEOUT_SECONDS
from src.constantes.constantes_validacion import TEXT_PATTERN
from src.utilerias.util_inyeccion import Injection


class PageReader:
    """
    Lee una página con el backend (`POST /scrape`, que ya valida el destino) y deja solo lo que sirve de lista:
    primero listas y tablas que empiezan con números y, si no hay, las demás y los encabezados o párrafos.
    El texto de la página es ajeno, así que se descartan los renglones largos o con código antes de dárselo al modelo.
    """

    _QUANTITY = re.compile(QUANTITY_START, re.IGNORECASE)
    _TEXT = re.compile(TEXT_PATTERN)
    _TITLE_SEPARATOR = re.compile(PAGE_TITLE_SEPARATOR)

    def __init__(self, api: Backend) -> None:
        self._api = api

    def read(self, url: str) -> dict:
        """Título de la página y las fuentes de cosas encontradas, ya depuradas."""
        page = self._api.post(SCRAPE_PATH, {"url": url}, timeout=SCRAPE_TIMEOUT_SECONDS)
        return {
            "title": self._clean(self._TITLE_SEPARATOR.split(page.get("title", ""))[0], MAX_PAGE_TITLE),
            "lists": self._select(page),
            "note": PAGE_DATA_NOTE,
        }

    def _select(self, page: dict) -> list[dict]:
        structured = self._rank(self._structured(page))
        measured = any(self._share(source["items"]) > 0 for source in structured)
        kept = structured[:MAX_PAGE_LISTS] if measured else structured[:MAX_PAGE_LISTS - FALLBACK_SOURCES]
        return kept if measured else kept + self._fallback(page)

    def _structured(self, page: dict) -> list[dict]:
        lists = [self._source("lista", entry["items"]) for entry in page.get("lists", [])]
        tables = [
            self._source("tabla", [" ".join(filter(None, row)) for row in table["rows"]])
            for table in page.get("tables", [])
        ]
        return [source for source in lists + tables if self._useful(source)]

    def _fallback(self, page: dict) -> list[dict]:
        headings = [heading["text"] for heading in page.get("headings", []) if heading["level"] >= MIN_HEADING_LEVEL]
        sources = [self._source("encabezados", headings), self._source("parrafos", page.get("paragraphs", []))]
        return [source for source in sources if self._useful(source)]

    def _rank(self, sources: list[dict]) -> list[dict]:
        return sorted(sources, key=lambda source: (-self._share(source["items"]), -len(source["items"])))

    def _share(self, items: list[str]) -> float:
        return sum(1 for item in items if self._QUANTITY.match(item)) / len(items) if items else 0

    def _source(self, kind: str, items: list[str]) -> dict:
        kept = [text for text in (self._clean(item, MAX_ITEM_LENGTH) for item in items) if text]
        return {"source": kind, "items": list(dict.fromkeys(kept))[:MAX_CHECKLIST_ITEMS]}

    def _clean(self, text: str, limit: int) -> str:
        """El texto sin espacios sobrantes, o vacío si es largo, tiene caracteres raros o parece script o SQL."""
        normalized = Injection.normalize(str(text)).strip()
        valid = 0 < len(normalized) <= limit and self._TEXT.match(normalized) and not Injection.detect(normalized)
        return normalized if valid else ""

    @staticmethod
    def _useful(source: dict) -> bool:
        return len(source["items"]) >= MIN_USEFUL_ITEMS
