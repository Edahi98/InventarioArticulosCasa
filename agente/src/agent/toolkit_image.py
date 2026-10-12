from src.decorators.decorator_dto_validator import DtoValidator
from src.dtos.dto_image_url import ImageUrlDto
from src.dtos.dto_svg import SvgDto
from src.decorators.decorator_tool_registry import ToolRegistry
from src.services.uploader_image import ImageUploader


@ToolRegistry.register
class ImageToolkit:
    """Tools de imágenes."""

    def __init__(self, uploader: ImageUploader) -> None:
        self._uploader = uploader

    @DtoValidator.tool(ImageUrlDto)
    def subir_imagen(self, image_url: str) -> str:
        """
        Descarga una imagen desde image_url y la sube al sistema de almacenamiento.
        Retorna la URL pública final para usar en artículos o categorías.
        """
        return self._uploader.upload_from_url(image_url)

    @DtoValidator.tool(SvgDto)
    def crear_imagen(self, svg: str) -> str:
        """
        Crea una imagen a partir de un dibujo SVG que tú escribes (solo formas, degradados y texto, sin
        scripts ni recursos externos; usa viewBox="0 0 512 512"), la convierte a PNG y la sube.
        Retorna la URL pública final para usar como image_url en artículos o categorías.
        """
        return self._uploader.upload_from_svg(svg)
