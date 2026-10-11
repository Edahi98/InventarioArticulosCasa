from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont
from src.constantes.constantes_colores import Colors
from src.constantes.constantes_imagenes import ELLIPSIS
from src.utilerias.util_codec import Codec



class GridImageBuilder:
    """
    Builder fluent para componer imágenes sobre una cuadrícula.

    Capas, de abajo hacia arriba: fondo de celdas -> backgrounds (PNG) -> contenido de celda
    (relleno, imagen, texto, en orden de inserción) -> overlays (PNG).
    Todo elemento se ancla a una celda (row, col) y ocupa el área fusionada con merge_cells.
    """
    _ANCHOR = {'left': 0, 'top': 0, 'center': 0.5, 'middle': 0.5, 'right': 1, 'bottom': 1}

    def __init__(self):
        self._rows = 0
        self._cols = 0
        self._cell_size = 100
        self._bg_color = Colors.WHITE.value
        self._cells: dict[tuple[int, int], list[dict]] = {}
        self._merges: dict[tuple[int, int], tuple[int, int]] = {}
        self._merged_cells: set[tuple[int, int]] = set()
        self._backgrounds: list[dict] = []
        self._overlays: list[dict] = []


    def set_grid(self, rows: int, cols: int) -> 'GridImageBuilder':
        self._rows, self._cols = rows, cols
        return self

    def set_cell_size(self, size: int) -> 'GridImageBuilder':
        self._cell_size = size
        return self

    def set_background(self, color) -> 'GridImageBuilder':
        """Color de fondo; None deja el lienzo transparente (útil para componer luego sobre otro fondo)."""
        self._bg_color = color.value if isinstance(color, Colors) else color
        return self

    def merge_cells(self, row: int, col: int, row_span: int = 1, col_span: int = 1) -> 'GridImageBuilder':
        """Fusiona un bloque de celdas a partir de (row, col) en una sola celda de row_span x col_span."""
        if row_span < 1 or col_span < 1:
            raise ValueError("row_span y col_span deben ser positivos.")
        if row + row_span > self._rows or col + col_span > self._cols:
            raise ValueError("El área de fusión excede los límites de la cuadrícula.")

        self._merges[(row, col)] = (row_span, col_span)
        for r in range(row, row + row_span):
            for c in range(col, col + col_span):
                if (r, c) != (row, col):
                    self._merged_cells.add((r, c))
        return self


    def fill_cell(self, row: int, col: int, color, radius: int = 0, top_only: bool = False) -> 'GridImageBuilder':
        """Rellena la celda; radius redondea esquinas y top_only redondea solo las superiores (pestañas)."""
        c = color.value if isinstance(color, Colors) else color
        return self._put(row, col, {'type': 'fill', 'value': c, 'radius': radius, 'top_only': top_only})

    def add_text(self, row: int, col: int, text: str, size: int = 14, color=(0, 0, 0), bold: bool = False,
                 align: str = 'center', valign: str = 'middle', padding: int = 0,
                 max_lines: int = 1, line_height: int | None = None) -> 'GridImageBuilder':
        """
        Texto dentro del área de la celda, con la fuente integrada de Pillow al tamaño indicado.
        align: left|center|right, valign: top|middle|bottom. Si no cabe en max_lines, termina en "…".
        """
        color = color.value if isinstance(color, Colors) else color
        return self._put(row, col, {
            'type': 'text', 'text': text, 'size': size, 'bold': bold, 'color': color, 'align': align,
            'valign': valign, 'padding': padding, 'max_lines': max_lines, 'line_height': line_height,
        })

    def add_image(self, row: int, col: int, image_obj: Image.Image, fit: str = 'cover', padding: int = 0) -> 'GridImageBuilder':
        """
        Recibe explícitamente un PIL.Image (DRY: I/O fuera del builder).
        fit: cover (recorta, sin deformar) | stretch (deforma al área).
        """
        return self._put(row, col, {'type': 'img', 'obj': image_obj.convert('RGBA'), 'fit': fit, 'padding': padding})

    def add_background(self, row: int, col: int, image_obj: Image.Image,
                       row_span: int = 1, col_span: int = 1, tile: bool = False) -> 'GridImageBuilder':
        """PNG de fondo bajo el contenido de las celdas. tile=True lo repite en vez de estirarlo."""
        self._backgrounds.append({'pos': (row, col), 'span': (row_span, col_span), 'obj': image_obj.convert('RGBA'), 'tile': tile})
        return self

    def add_overlay(self, row: int, col: int, image_obj: Image.Image,
                    row_span: int = 1, col_span: int = 1) -> 'GridImageBuilder':
        """PNG con transparencia sobre el contenido de las celdas (marcos, esquineros, sellos)."""
        self._overlays.append({'pos': (row, col), 'span': (row_span, col_span), 'obj': image_obj.convert('RGBA'), 'tile': False})
        return self

    def _put(self, row: int, col: int, item: dict) -> 'GridImageBuilder':
        self._cells.setdefault((row, col), []).append(item)
        return self


    def build(self) -> Image.Image:
        if self._rows <= 0 or self._cols <= 0:
            raise ValueError("Las dimensiones de la cuadrícula deben ser positivas.")

        canvas = self._create_canvas()
        for layer in self._backgrounds:
            self._paste_layer(canvas, layer)
        self._render_cells(canvas)
        for layer in self._overlays:
            self._paste_layer(canvas, layer)
        return canvas if self._bg_color is None else canvas.convert('RGB')

    def _create_canvas(self) -> Image.Image:
        size = (self._cols * self._cell_size, self._rows * self._cell_size)
        return Image.new('RGBA', size, (0, 0, 0, 0) if self._bg_color is None else self._bg_color)

    def _area(self, row: int, col: int, row_span: int = 1, col_span: int = 1) -> tuple[int, int, int, int]:
        s = self._cell_size
        return col * s, row * s, col_span * s, row_span * s

    def _paste_layer(self, canvas: Image.Image, layer: dict):
        x0, y0, w, h = self._area(*layer['pos'], *layer['span'])
        fit = {True: self._tile, False: self._stretch}[layer['tile']]
        canvas.alpha_composite(fit(layer['obj'], w, h), (x0, y0))

    @staticmethod
    def _stretch(img: Image.Image, w: int, h: int) -> Image.Image:
        return img.resize((w, h), Image.LANCZOS)

    @staticmethod
    def _tile(img: Image.Image, w: int, h: int) -> Image.Image:
        tiled = Image.new('RGBA', (w, h))
        for ty in range(0, h, img.height):
            for tx in range(0, w, img.width):
                tiled.paste(img, (tx, ty))
        return tiled

    def _render_cells(self, canvas: Image.Image):
        draw = ImageDraw.Draw(canvas, 'RGBA')
        for (r, c), items in self._cells.items():
            if (r, c) in self._merged_cells:
                continue
            row_span, col_span = self._merges.get((r, c), (1, 1))
            x0, y0, w, h = self._area(r, c, row_span, col_span)
            for item in items:
                self._draw_item(draw, canvas, x0, y0, w, h, item)

    def _draw_item(self, draw: ImageDraw.ImageDraw, canvas: Image.Image, x0: int, y0: int, w: int, h: int, item: dict):
        """Enrutador que delega a renderizadores específicos."""
        draw_item = {'fill': self._fill_rect, 'text': self._render_text, 'img': self._paste_image}
        draw_item[item['type']](draw, canvas, x0, y0, w, h, item)

    def _fill_rect(self, draw: ImageDraw.ImageDraw, canvas: Image.Image, x0: int, y0: int, w: int, h: int, item: dict):
        corners = (True, True, False, False) if item['top_only'] else None
        draw.rounded_rectangle([x0, y0, x0 + w - 1, y0 + h - 1], radius=item['radius'],
                               fill=item['value'], corners=corners)

    def _render_text(self, draw: ImageDraw.ImageDraw, canvas: Image.Image, x0: int, y0: int, w: int, h: int, item: dict):
        font, pad = self._font(item['size']), item['padding']
        inner_w = w - 2 * pad
        lh = item['line_height'] or int(item['size'] * 1.3)
        lines = self._wrap(draw, Codec.strip_accents(item['text']), font, inner_w, item['max_lines'])
        block_h = len(lines) * lh
        y = y0 + pad + (h - 2 * pad - block_h) * self._ANCHOR[item['valign']]

        for line in lines:
            tw = draw.textlength(line, font=font)
            x = x0 + pad + (inner_w - tw) * self._ANCHOR[item['align']]
            draw.text((x, y), line, fill=item['color'], font=font,
                      stroke_width=int(item['bold'] and item['size'] >= 13), stroke_fill=item['color'])
            y += lh

    @staticmethod
    @lru_cache(maxsize=None)
    def _font(size: int) -> ImageFont.ImageFont:
        return ImageFont.load_default(size)

    @staticmethod
    def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_w: int, max_lines: int) -> list[str]:
        """Parte el texto por palabras en hasta max_lines líneas; lo que no cabe termina en '…'."""
        lines, cur = [], ""
        for word in text.split():
            trial = f"{cur} {word}".strip()
            fits = not cur or draw.textlength(trial, font=font) <= max_w
            lines += [] if fits else [cur]
            cur = trial if fits else word
        lines += [cur] if cur else []

        overflow = len(lines) > max_lines
        lines = lines[:max_lines] or [""]
        last = len(lines) - 1
        return [
            GridImageBuilder._ellipsize(draw, line, font, max_w)
            if (overflow and i == last) or draw.textlength(line, font=font) > max_w else line
            for i, line in enumerate(lines)
        ]

    @staticmethod
    def _ellipsize(draw: ImageDraw.ImageDraw, line: str, font: ImageFont.ImageFont, max_w: int) -> str:
        line = line.rstrip()
        while line and draw.textlength(line + ELLIPSIS, font=font) > max_w:
            line = line[:-1]
        return line + ELLIPSIS

    def _paste_image(self, draw: ImageDraw.ImageDraw, canvas: Image.Image, x0: int, y0: int, w: int, h: int, item: dict):
        p = item['padding']
        iw, ih = w - 2 * p, h - 2 * p
        canvas.alpha_composite(self._fit(item['obj'], iw, ih, item['fit']), (x0 + p, y0 + p))

    @staticmethod
    def _fit(img: Image.Image, w: int, h: int, fit: str) -> Image.Image:
        if fit == 'stretch':
            return img.resize((w, h), Image.LANCZOS)

        scale = max(w / img.width, h / img.height)
        nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
        resized = img.resize((nw, nh), Image.LANCZOS)
        out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        out.paste(resized, ((w - nw) // 2, (h - nh) // 2))
        return out
