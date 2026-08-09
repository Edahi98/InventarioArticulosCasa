import urllib.request
from langchain_core.tools import tool
from ...application.services.image_service import ImageService
from ...services.image_renderer import _fix_url


def build_image_tools(service: ImageService) -> list:
    @tool
    def subir_imagen(image_url: str) -> str:
        """
        Descarga una imagen desde image_url y la sube al sistema de almacenamiento.
        Retorna la URL pública final para usar en artículos o categorías.
        """
        internal_url = _fix_url(image_url)
        req = urllib.request.Request(internal_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        filename = image_url.split("/")[-1] or "image.jpg"
        return service.upload(data, filename)

    return [subir_imagen]
