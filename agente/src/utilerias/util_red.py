from requests import get
from PIL import Image
from io import BytesIO
from src.constantes.constantes_red import BACKEND_INTERNAL_URL, BACKEND_PUBLIC_URL

class Red:
    """
    Manejo de recursos de la red de los servicios externos
    """
    @staticmethod
    def fix_url(url: str) -> str:
        """Reemplaza la URL pública por la interna del contenedor."""
        if url and BACKEND_PUBLIC_URL in url:
            return url.replace(BACKEND_PUBLIC_URL, BACKEND_INTERNAL_URL)
        return url

    @staticmethod
    def download(url: str) -> bytes:
        """Descarga el recurso y devuelve sus bytes; lanza HTTPError si el servidor responde con error."""
        res = get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        res.raise_for_status()
        return res.content

    @staticmethod
    def fetch_image(url: str) -> Image:
        """Pide el recurso de imagen de la categoria o articulo, devolviendo un objeto Image de Pillow"""
        return Image.open(BytesIO(Red.download(url))).convert("RGB")
