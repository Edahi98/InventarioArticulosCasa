from __future__ import annotations
import io
from zlib import crc32
import requests
from PIL import Image
from src.utilerias.util_red import Red
from src.services.images.asset_loader import AssetLoader
from src.constantes.constantes_colores import Colors
from src.constantes.constantes_imagenes import (
    CARD_COLS, CARD_ROWS, CELL_SIZE, LINE,
    ROW_NAME, ROW_PHOTO, ROW_STATE, ROW_TAB, TAB_COLORS,
)
from src.builders.builder_gallery_image import GalleryImageBuilder
from src.builders.builder_grid_image import GridImageBuilder


class CardImageRenderer:
    """Arma fichas de archivo de artículos/categorías sobre una grilla, usando GridImageBuilder."""

    def render(self, data) -> list[bytes]:
        """
        Agrupa en galerías los artículos y categorías que haya en data (un dict, una lista o una lista de
        resultados de tools). Un mismo artículo o categoría que aparece en varias tools sale una sola vez.
        """
        items = self._unique(self._flatten(data))
        articles = [self._article_card(i) for i in items if self._is_article(i)]
        categories = [self._category_card(i) for i in items if self._is_category(i)]
        return [
            self._gallery(cards, noun)
            for cards, noun in ((articles, "artículos"), (categories, "categorías"))
            if cards
        ]

    @staticmethod
    def _flatten(data) -> list[dict]:
        parts = data if isinstance(data, list) else [data]
        return [i for part in parts for i in (part if isinstance(part, list) else [part]) if isinstance(i, dict)]

    @classmethod
    def _unique(cls, items: list[dict]) -> list[dict]:
        """Une los repetidos por tipo e id; el dato más reciente gana, pero no pisa campos con vacíos."""
        merged: dict = {}
        for item in items:
            key = (cls._is_article(item), item.get("id", id(item)))
            filled = {k: v for k, v in item.items() if v is not None and v != ""}
            merged[key] = {**merged.get(key, {}), **filled}
        return list(merged.values())

    @staticmethod
    def _is_article(item: dict) -> bool:
        return "categoryId" in item or "needsRepair" in item

    @classmethod
    def _is_category(cls, item: dict) -> bool:
        return "id" in item and "name" in item and not cls._is_article(item)

    def _gallery(self, cards: list[Image.Image], noun: str) -> bytes:
        title = f"Inventario - {len(cards)} {noun}" if len(cards) > 1 else None
        image = GalleryImageBuilder().with_images(cards).with_title(title).build()
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()

    def _card_base(self, tab_label: str) -> GridImageBuilder:
        """Hoja con perforaciones y pestaña; el fondo queda transparente para componer sobre el escritorio."""
        tab_color = TAB_COLORS[crc32(tab_label.encode()) % len(TAB_COLORS)]
        return (
            GridImageBuilder()
            .set_grid(CARD_ROWS, CARD_COLS)
            .set_cell_size(CELL_SIZE)
            .set_background(None)
            .add_background(1, 0, AssetLoader.load("ficha_paper.png"), row_span=CARD_ROWS - 1, col_span=CARD_COLS)
            .merge_cells(ROW_TAB, 1, col_span=4)
            .fill_cell(ROW_TAB, 1, tab_color, radius=8, top_only=True)
            .add_text(ROW_TAB, 1, tab_label.upper()[:14], size=13, bold=True, color=Colors.INK, padding=6)
        )

    def _article_card(self, article: dict) -> Image.Image:
        needs_repair = bool(article.get("needsRepair"))
        name = article.get("name", "") or ""
        category_name = article.get("categoryName") or "Sin categoría"
        stock = str(article.get("stock", 0))

        ok_color, bad_color = Colors.GREEN_INK, Colors.RED_INK

        b = self._card_base(category_name)
        b.merge_cells(ROW_NAME, 1, row_span=2, col_span=7)
        b.add_text(ROW_NAME, 1, name, size=16, bold=True, color=Colors.INK,
                   align='left', valign='top', max_lines=2, line_height=LINE)

        self._place_photo(b, article.get("imageUrl", ""), col_span=4)

        b.merge_cells(ROW_PHOTO, 5, col_span=3)
        b.add_text(ROW_PHOTO, 5, "CANTIDAD", size=11, bold=True, color=Colors.MUTED)
        b.merge_cells(ROW_PHOTO + 1, 5, row_span=2, col_span=3)
        b.add_text(ROW_PHOTO + 1, 5, stock[:4], size=40, bold=True, color=Colors.INK)

        b.merge_cells(ROW_STATE, 1, col_span=7)
        b.add_text(ROW_STATE, 1, "ESTADO", size=11, bold=True, color=Colors.MUTED, align='left', valign='top', line_height=LINE)
        for i, (text, active, color) in enumerate((
            ("En buen estado", not needs_repair, ok_color),
            ("Necesita reparación", needs_repair, bad_color),
        ), start=1):
            b.merge_cells(ROW_STATE + i, 1, col_span=7)
            b.add_text(ROW_STATE + i, 1, f"[{'x' if active else ' '}] {text}",
                       size=14, bold=active, color=color if active else Colors.MUTED,
                       align='left', valign='top', line_height=LINE)
        return b.build()

    def _category_card(self, category: dict) -> Image.Image:
        name = category.get("name", "") or ""
        desc = category.get("description", "") or "Sin descripción"

        b = self._card_base("Categoría")
        b.merge_cells(ROW_NAME, 1, row_span=2, col_span=7)
        b.add_text(ROW_NAME, 1, name, size=16, bold=True, color=Colors.INK,
                   align='left', valign='top', max_lines=2, line_height=LINE)

        self._place_photo(b, category.get("imageUrl", ""), col_span=7)

        b.merge_cells(ROW_STATE, 1, row_span=3, col_span=7)
        b.add_text(ROW_STATE, 1, desc, size=13, color=Colors.TEXT,
                   align='left', valign='top', max_lines=6, line_height=LINE)
        return b.build()

    @staticmethod
    def _add_photo(builder: GridImageBuilder, image_url: str) -> None:
        """Foto desde su URL; si no se puede descargar o no es una imagen válida, deja el recuadro vacío."""
        try:
            photo = Red.fetch_image(image_url)
        except (requests.RequestException, OSError):
            CardImageRenderer._add_empty_frame(builder, image_url)
            return
        builder.add_image(ROW_PHOTO, 1, photo, fit='cover', padding=8)

    @staticmethod
    def _add_empty_frame(builder: GridImageBuilder, image_url: str) -> None:
        builder.fill_cell(ROW_PHOTO, 1, Colors.SHADOW)
        builder.add_text(ROW_PHOTO, 1, "SIN FOTO", size=12, bold=True,
                         color=Colors.MUTED)

    def _place_photo(self, builder: GridImageBuilder, image_url: str, col_span: int) -> None:
        """Foto sujeta con esquineros; si no hay, un recuadro vacío con la leyenda."""
        builder.merge_cells(ROW_PHOTO, 1, row_span=4, col_span=col_span)
        {True: self._add_photo, False: self._add_empty_frame}[bool(image_url)](builder, image_url)
        builder.add_overlay(ROW_PHOTO, 1, AssetLoader.load(f"photo_corners_{col_span}x4.png"), row_span=4, col_span=col_span)
