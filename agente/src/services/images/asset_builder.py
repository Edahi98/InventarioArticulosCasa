import random
from PIL import Image, ImageDraw
from src.constantes.constantes_colores import Colors
from src.constantes.constantes_imagenes import ASSETS_DIR, CELL_SIZE, RULE_PHASE, RULE_STEP


class AssetBuilder:
    """
    Genera los PNG de fondo de la ficha de archivo en assets/. Se ejecuta a mano cuando cambia el diseño:

        python -m src.services.images.asset_builder

    Las medidas están pensadas para una celda de CELL_SIZE px.
    """

    @classmethod
    def build_all(cls) -> None:
        ASSETS_DIR.mkdir(exist_ok=True)
        cls.paper(8, 10).save(ASSETS_DIR / "ficha_paper.png")
        cls.photo_corners(4, 4).save(ASSETS_DIR / "photo_corners_4x4.png")
        cls.photo_corners(7, 4).save(ASSETS_DIR / "photo_corners_7x4.png")
        cls.desk().save(ASSETS_DIR / "desk_tile.png")

    @staticmethod
    def paper(cols: int, rows: int) -> Image.Image:
        """Hoja de ficha: renglones azules, margen rojo y dos perforaciones transparentes."""
        w, h = cols * CELL_SIZE, rows * CELL_SIZE
        img = Image.new("RGBA", (w, h), Colors.PAPER.value + (255,))
        d = ImageDraw.Draw(img)
        for y in range(RULE_PHASE, h, RULE_STEP):
            d.line([(0, y), (w, y)], fill=Colors.RULE.value, width=1)
        d.line([(34, 0), (34, h)], fill=Colors.MARGIN.value, width=2)
        d.rectangle([0, 0, w - 1, h - 1], outline=(214, 204, 184), width=1)
        d.line([(0, h - 2), (w, h - 2)], fill=(200, 188, 165), width=2)
        for cy in (h // 4, 3 * h // 4):
            d.ellipse([10, cy - 7, 24, cy + 7], fill=(0, 0, 0, 0))
        return img

    @staticmethod
    def photo_corners(cols: int, rows: int, size: int = 24) -> Image.Image:
        """Esquineros negros de álbum para sujetar una foto."""
        w, h = cols * CELL_SIZE, rows * CELL_SIZE
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        ink = Colors.INK.value + (255,)
        d.polygon([(0, 0), (size, 0), (0, size)], fill=ink)
        d.polygon([(w - 1, 0), (w - 1 - size, 0), (w - 1, size)], fill=ink)
        d.polygon([(0, h - 1), (size, h - 1), (0, h - 1 - size)], fill=ink)
        d.polygon([(w - 1, h - 1), (w - 1 - size, h - 1), (w - 1, h - 1 - size)], fill=ink)
        return img

    @staticmethod
    def desk(size: int = 160) -> Image.Image:
        """Textura de escritorio repetible (solo motas y fibras sueltas, sin costuras)."""
        rng = random.Random(7)
        img = Image.new("RGBA", (size, size), Colors.DESK.value + (255,))
        d = ImageDraw.Draw(img)
        for _ in range(260):
            x, y, t = rng.randrange(size), rng.randrange(size), rng.randint(-14, 10)
            c = tuple(max(0, min(255, v + t)) for v in Colors.DESK.value)
            d.point((x, y), fill=c)
            if rng.random() < 0.3:
                d.point(((x + 1) % size, y), fill=c)
        return img


if __name__ == "__main__":
    AssetBuilder.build_all()
