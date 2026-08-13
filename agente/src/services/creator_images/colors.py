from enum import Enum

class ColorEnum(Enum):
    """Colores de color de fondo y de texto"""
    FONDO_ROJO = (255, 0, 0)
    FONDO_AZUL = (0, 0, 255)
    FONDO_VERDE = (0, 128, 0)
    TEXTO_AZUL = (0, 0, 0)
    TEXTO_BLANCO = (255, 255, 255)