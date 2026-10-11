from functools import lru_cache
from PIL import Image
from src.constantes.constantes_imagenes import ASSETS_DIR


class AssetLoader:
    """Carga (con caché) de los PNG de fondo generados por `AssetBuilder`."""

    @staticmethod
    @lru_cache(maxsize=None)
    def load(name: str) -> Image.Image:
        """Devuelve el PNG en RGBA; lanza FileNotFoundError si no se generó con AssetBuilder."""
        return Image.open(ASSETS_DIR / name).convert("RGBA")
