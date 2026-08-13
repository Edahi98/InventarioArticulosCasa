from PIL import ImageFont

class SysUtilerias:
    "Manejo de recursos del sistema operativo"

    @staticmethod
    def get_font(size: int, bold: bool = False) -> ImageFont:
        """Selección de la fuente de la letra para las letras de imagen, devuelve un objeto ImageFont"""
        fonts = ["arialbd.ttf" if bold else "arial.ttf", 
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
        
        for path in fonts:
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
        return ImageFont.load_default()