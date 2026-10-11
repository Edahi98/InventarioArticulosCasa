from src.decorators.decorator_tool_registry import ToolRegistry
from src.services.uploader_image import ImageUploader


@ToolRegistry.register
class ImageToolkit:
    """Tools de imágenes."""

    def __init__(self, uploader: ImageUploader) -> None:
        self._uploader = uploader

    def subir_imagen(self, image_url: str) -> str:
        """
        Descarga una imagen desde image_url y la sube al sistema de almacenamiento.
        Retorna la URL pública final para usar en artículos o categorías.
        """
        return self._uploader.upload_from_url(image_url)
