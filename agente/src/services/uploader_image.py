from src.constantes.constantes_svg import SVG_FILENAME
from src.services.client_inventory import InventoryClient
from src.services.renderer_svg import SvgRenderer
from src.utilerias.util_red import Red


class ImageUploader:
    """Sube imágenes al almacenamiento del backend: descargadas desde una URL o dibujadas como SVG."""

    def __init__(self, inventory: InventoryClient) -> None:
        self._inventory = inventory

    def upload_from_url(self, image_url: str) -> str:
        """URL pública final de la imagen subida."""
        data = Red.download(image_url)
        return self._inventory.upload_image(data, image_url.split("/")[-1] or "image.jpg")

    def upload_from_svg(self, svg: str) -> str:
        """Convierte el SVG a PNG, lo sube y retorna su URL pública."""
        return self._inventory.upload_image(SvgRenderer.to_png(svg), SVG_FILENAME)
