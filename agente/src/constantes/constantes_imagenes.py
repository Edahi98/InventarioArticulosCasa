from pathlib import Path
from src.constantes.constantes_colores import Colors

CELL_SIZE = 40
CARD_ROWS, CARD_COLS = 11, 8
GALLERY_ITEMS_PER_ROW = 3
GALLERY_HEADER_ROWS = 2
GALLERY_GUTTER = 1

ROW_TAB, ROW_NAME, ROW_PHOTO, ROW_STATE = 0, 1, 3, 8
LINE = CELL_SIZE // 2
RULE_STEP = CELL_SIZE // 2
RULE_PHASE = RULE_STEP - 1

TAB_COLORS = (Colors.YELLOW, Colors.PEACH, Colors.MINT, Colors.SKY, Colors.LAVENDER, Colors.PINK)
ELLIPSIS = "..."

ASSETS_DIR = Path(__file__).resolve().parent.parent / "services" / "images" / "assets"
GALLERY_TITLE_SIZE = 18
