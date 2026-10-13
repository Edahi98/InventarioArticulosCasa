import resvg_py

from src.constantes.constantes_svg import SVG_OUTPUT_WIDTH


class SvgRenderer:
    """Convierte un SVG ya validado a PNG con resvg (sin acceso a archivos locales ni a la red)."""

    @staticmethod
    def to_png(svg: str) -> bytes:
        """Bytes del PNG renderizado con el ancho fijo de salida."""
        return bytes(resvg_py.svg_to_bytes(svg_string=svg, width=SVG_OUTPUT_WIDTH))
