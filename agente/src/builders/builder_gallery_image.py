from PIL import Image

from src.builders.builder_grid_image import GridImageBuilder
from src.constantes.constantes_colores import Colors
from src.constantes.constantes_imagenes import (
    CARD_COLS, CARD_ROWS, CELL_SIZE, GALLERY_GUTTER, GALLERY_HEADER_ROWS,
    GALLERY_ITEMS_PER_ROW, GALLERY_TITLE_SIZE,
)
from src.services.images.asset_loader import AssetLoader


class GalleryImageBuilder:
    """Builder fluent que acomoda varias fichas (fondo transparente) sobre un escritorio, con título opcional."""

    def __init__(self) -> None:
        self._images: list[Image.Image] = []
        self._title: str | None = None

    def with_images(self, images: list[Image.Image]) -> "GalleryImageBuilder":
        self._images = images
        return self

    def with_title(self, title: str | None) -> "GalleryImageBuilder":
        self._title = title
        return self

    def build(self) -> Image.Image:
        per_row = min(GALLERY_ITEMS_PER_ROW, len(self._images))
        n_rows = -(-len(self._images) // per_row)
        header = GALLERY_HEADER_ROWS if self._title else 0
        rows = header + GALLERY_GUTTER + n_rows * (CARD_ROWS + GALLERY_GUTTER)
        cols = GALLERY_GUTTER + per_row * (CARD_COLS + GALLERY_GUTTER)

        builder = (
            GridImageBuilder()
            .set_grid(rows, cols)
            .set_cell_size(CELL_SIZE)
            .set_background(Colors.DESK)
            .add_background(0, 0, AssetLoader.load("desk_tile.png"), row_span=rows, col_span=cols, tile=True)
        )
        if self._title:
            builder.merge_cells(0, 0, row_span=header, col_span=cols)
            builder.add_text(0, 0, self._title, size=GALLERY_TITLE_SIZE, bold=True, color=Colors.INK,
                             align='left', valign='bottom', padding=CELL_SIZE)

        for i, image in enumerate(self._images):
            r0 = header + GALLERY_GUTTER + (i // per_row) * (CARD_ROWS + GALLERY_GUTTER)
            c0 = GALLERY_GUTTER + (i % per_row) * (CARD_COLS + GALLERY_GUTTER)
            builder.merge_cells(r0, c0, row_span=CARD_ROWS, col_span=CARD_COLS)
            builder.add_image(r0, c0, image, fit='stretch')

        return builder.build()
