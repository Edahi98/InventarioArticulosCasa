from os import getenv
from requests import get
from PIL import Image
from io import BytesIO

class RedUtilerias:
    """
    Manejo de recursos de la red de los servicios externos
    """
    # Consultas de variables de entorno para resolver URLs internas de Docker
    _BACKEND_INTERNAL = getenv("BACKEND_URL", "http://inventario-backend:4000")
    _BACKEND_PUBLIC = getenv("PUBLIC_URL",  "http://localhost:4000")

    @staticmethod
    def fix_url(url: str) -> str:
        """Reemplaza la URL pública por la interna del contenedor."""
        if url and RedUtilerias._BACKEND_PUBLIC in url:
            return url.replace(RedUtilerias._BACKEND_PUBLIC, RedUtilerias._BACKEND_INTERNAL)
        return url
    
    @staticmethod
    def fetch_image(url: str) -> Image:
        """Pide el recurso de imagen de la categoria o articulo, devolviendo un objeto Image de Pillow"""
        req = get(url, headers={"User-Agent": "Mozilla/5.0"})
        return Image.open(BytesIO(req.content)).convert("RGB")