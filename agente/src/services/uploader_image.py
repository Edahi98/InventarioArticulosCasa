from src.services.client_inventory import InventoryClient
from src.utilerias.util_red import Red


class ImageUploader:
    """Descarga una imagen desde una URL y la sube al almacenamiento del backend."""

    def __init__(self, inventory: InventoryClient) -> None:
        self._inventory = inventory

    def upload_from_url(self, image_url: str) -> str:
        """URL pública final de la imagen subida."""
        data = Red.download(Red.fix_url(image_url))
        return self._inventory.upload_image(data, image_url.split("/")[-1] or "image.jpg")
