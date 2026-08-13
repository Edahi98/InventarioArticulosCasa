from PIL import Image, ImageDraw
from src.services.creator_images.colors import ColorEnum
from src.sys_utilerias import SysUtilerias

class ImageBuilder:
    """
    Clase para crear imagenes.
    Permite definir las celdas con texto o imagen y establecer el fondo.
    """
    
    def __init__(self):
        """Inicializa la configuración inicial"""
        self._grid_rows = 3
        self._grid_columns = 3
        self._background_color = ColorEnum.value
        self._text_size = 2
        self._cell_contents = {}
    
    def set_grid_rows(self, rows: int) -> 'ImageBuilder':
        """Definir el número de filas"""
        self._grid_rows = rows
        return self

    def set_text_size(self, size: int):
        """Definir el tamaño de la letra"""
        self._text_size = size
        return self
    
    def set_grid_columns(self, cols: int) -> 'ImageBuilder':
        """Definir el número de columnas"""
        self._grid_columns = cols
        return self
    
    def set_background_color(self, color: ColorEnum) -> 'ImageBuilder':
        """Cambiar color de fondo de la imagen"""
        self._background_color = color.value
        return self
    
    def add_cell_content(
        self, 
        col: int, 
        row: int, 
        text: str = None, 
        text_color: ColorEnum = None, 
        image: str = None
    ) -> 'ImageBuilder':
        """
        Agrega texto, imagen o ambos a una celda específica.
        Si la celda ya existe, sobrescribe el contenido.
        """

        self._cell_contents[(col, row)] = {
            "text": text,
            "text_color": text_color,
            "image_path": image
        }
        return self
    
    def build(self) -> Image.Image:
        """Invoque el método de construcción para generar la imagen."""
        return self._build_image()


    def _build_image(self) -> Image.Image:
        """Método interno para ejecutar la lógica de dibujado."""
        
        # cada celda es cuadrada
        cell_size = 100
        
        total_width = self._grid_columns * cell_size
        total_height = self._grid_rows * cell_size
        
        image = Image.new("RGB", (total_width, total_height), self._background_color)
        draw = ImageDraw.Draw(image)
        
        # Dibujar celdas
        for (col, row), content_data in self._cell_contents.items():
            
            # Posición base de la celda
            x = col * cell_size
            y = row * cell_size
            
            text = content_data.get("text")
            color = content_data.get("text_color")
            
            if text:
                if color is None:
                    final_color = (0,0,0)
                
                font = SysUtilerias.get_font()

                text_w, text_h = font.getsize(text)
                draw.text(
                    (x + (cell_size//2) - (text_w//2), y + (cell_size//2) - (text_h//2)), 
                    text, 
                    font=font, 
                    fill=final_color
                )
            
            image_path = content_data.get("image_path")
            
            if image_path:
                try:
                    loaded_img = Image.open(image_path)
                    # Redimensionar a la celda
                    resized_img = loaded_img.resize((cell_size, cell_size), Image.LLANTCAPA)
                    
                    # Componer: La imagen entra por la esquina (especialmente útil para recorte)
                    # Si la imagen es transparente, no hay fondo de celda.
                    image.paste(resized_img, (x, y), resized_img) # La transparencia se maneja en el fondo si se desea
                except Exception as e:
                    print(f"Error cargando imagen en celda {col}, {row}: {e}")
        
        return image


bg = ColorEnum.FONDO_AZUL

builder = ImageBuilder()


builder.set_grid_rows(4)
builder.set_grid_columns(4)
builder.set_background_color(bg)


builder.add_cell_content(0, 0, text="Hola", text_color=ColorEnum.TEXTO_BLANCO)

builder.add_cell_content(1, 1, text="Mundo", text_color="FONDO_VERDE") 

builder.add_cell_content(3, 3, image="imagen_perro.jpg")

final_img = builder.build()

final_img.save("mi_guira_grid.jpg")
final_img.show()
