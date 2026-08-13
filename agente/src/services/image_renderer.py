from __future__ import annotations
import io
from src.red_utilerias import RedUtilerias
from src.sys_utilerias import SysUtilerias
from PIL import Image, ImageDraw, ImageFont

# ── Paleta tierna ─────────────────────────────────────────────────────────────
BG         = (255, 251, 247)   # crema cálido
SURFACE    = (255, 255, 255)   # blanco
SHADOW     = (230, 220, 210)   # sombra suave
PINK       = (255, 182, 193)   # rosa
PINK_DARK  = (219, 112, 147)
LAVENDER   = (216, 191, 216)
MINT       = (152, 218, 185)
PEACH      = (255, 218, 185)
CORAL      = (255, 127, 102)
SKY        = (173, 216, 230)
YELLOW     = (255, 236, 153)
TEXT       = ( 80,  60,  50)   # marrón suave
MUTED      = (160, 140, 130)
RED_SOFT   = (255, 100,  80)
GREEN_SOFT = ( 80, 190, 120)

CARD_W  = 700
IMG_SZ  = 200   # cuadrado de foto
PAD     = 22
RADIUS  = 18


def _circle_photo(photo: Image.Image, size: int) -> Image.Image:
    """Recorta la foto en círculo."""
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(photo, mask=mask)
    return result


def _pill(draw: ImageDraw.ImageDraw, x: int, y: int, text: str,
          bg: tuple, fg: tuple = TEXT) -> int:
    f = SysUtilerias.get_font(12, bold=True)
    tw = draw.textbbox((0, 0), text, font=f)[2]
    pw = tw + 20
    draw.rounded_rectangle([x, y, x + pw, y + 24], radius=12, fill=bg)
    draw.text((x + 10, y + 5), text, font=f, fill=fg)
    return pw + 8


def _render_article_card(article: dict) -> bytes:
    needs_repair = bool(article.get("needsRepair"))
    stock = article.get("stock", 0)
    accent = CORAL if needs_repair else MINT

    h = 290
    base = Image.new("RGB", (CARD_W, h), BG)
    draw = ImageDraw.Draw(base)

    # Sombra
    draw.rounded_rectangle([PAD + 4, PAD + 4, CARD_W - PAD + 4, h - PAD + 4],
                           radius=RADIUS, fill=SHADOW)
    # Card
    draw.rounded_rectangle([PAD, PAD, CARD_W - PAD, h - PAD],
                           radius=RADIUS, fill=SURFACE)

    # Franja superior de color
    draw.rounded_rectangle([PAD, PAD, CARD_W - PAD, PAD + 8],
                           radius=RADIUS, fill=accent)

    # ── Foto circular ─────────────────────────────────────────────────────
    photo_size = 130
    photo = RedUtilerias.fetch_image(article.get("imageUrl", ""), (photo_size, photo_size))
    px = CARD_W - PAD - photo_size - 20
    py = PAD + 24

    if photo:
        circle = _circle_photo(photo, photo_size)
        # Borde rosa alrededor del círculo
        border_img = Image.new("RGBA", (photo_size + 6, photo_size + 6), (0, 0, 0, 0))
        ImageDraw.Draw(border_img).ellipse([0, 0, photo_size + 5, photo_size + 5], fill=(*accent, 255))
        base.paste(border_img.convert("RGB"), (px - 3, py - 3),
                   mask=border_img.split()[3])
        base.paste(circle.convert("RGB"), (px, py), mask=circle.split()[3])
    else:
        draw.ellipse([px, py, px + photo_size, py + photo_size], fill=PEACH)
        draw.text((px + 30, py + 45), "📷", font=_font(40), fill=MUTED)

    # ── Texto ─────────────────────────────────────────────────────────────
    x0 = PAD + 20
    info_w = px - x0 - 10

    draw.text((x0, PAD + 18), f"N.° {article.get('id', '?')}", font=_font(12), fill=MUTED)

    name = article.get("name", "")[:30]
    draw.text((x0, PAD + 38), name, font=_font(21, bold=True), fill=TEXT)

    y = PAD + 78
    draw.line([(x0, y), (x0 + info_w, y)], fill=SHADOW, width=1)
    y += 14

    desc = (article.get("description", "") or "Sin descripción")[:60]
    draw.text((x0, y), desc, font=_font(12), fill=MUTED)
    y += 28

    # Stock con barra
    draw.text((x0, y), f"📦  Stock: {stock}", font=_font(13, bold=True), fill=TEXT)
    y += 20
    bar_w = info_w - 10
    draw.rounded_rectangle([x0, y, x0 + bar_w, y + 8], radius=4, fill=SHADOW)
    fill_w = int(bar_w * min(stock, 50) / 50)
    bar_color = GREEN_SOFT if stock > 5 else YELLOW if stock > 0 else RED_SOFT
    if fill_w:
        draw.rounded_rectangle([x0, y, x0 + fill_w, y + 8], radius=4, fill=bar_color)
    y += 20

    draw.text((x0, y), f"🏷️  Cat. {article.get('categoryId', '—')}", font=_font(13), fill=TEXT)
    y += 28

    # Pills
    x_p = x0
    if needs_repair:
        x_p += _pill(draw, x_p, y, "⚠️ Necesita reparación", PEACH, RED_SOFT)
    else:
        x_p += _pill(draw, x_p, y, "✓ En buen estado", MINT, TEXT)

    buf = io.BytesIO()
    base.save(buf, format="PNG")
    return buf.getvalue()


def _render_category_card(cat: dict) -> bytes:
    h = 230
    base = Image.new("RGB", (CARD_W, h), BG)
    draw = ImageDraw.Draw(base)

    draw.rounded_rectangle([PAD + 4, PAD + 4, CARD_W - PAD + 4, h - PAD + 4],
                           radius=RADIUS, fill=SHADOW)
    draw.rounded_rectangle([PAD, PAD, CARD_W - PAD, h - PAD],
                           radius=RADIUS, fill=SURFACE)
    draw.rounded_rectangle([PAD, PAD, CARD_W - PAD, PAD + 8],
                           radius=RADIUS, fill=LAVENDER)

    photo_size = 120
    photo = RedUtilerias.fetch_image(cat.get("imageUrl", ""), (photo_size, photo_size))
    px = CARD_W - PAD - photo_size - 20
    py = PAD + 24

    if photo:
        circle = _circle_photo(photo, photo_size)
        border_img = Image.new("RGBA", (photo_size + 6, photo_size + 6), (0, 0, 0, 0))
        ImageDraw.Draw(border_img).ellipse([0, 0, photo_size + 5, photo_size + 5],
                                          fill=(*LAVENDER, 255))
        base.paste(border_img.convert("RGB"), (px - 3, py - 3),
                   mask=border_img.split()[3])
        base.paste(circle.convert("RGB"), (px, py), mask=circle.split()[3])
    else:
        draw.ellipse([px, py, px + photo_size, py + photo_size], fill=LAVENDER)
        draw.text((px + 30, py + 35), "🗂️", font=_font(40), fill=MUTED)

    x0 = PAD + 20
    draw.text((x0, PAD + 18), f"N.° {cat.get('id', '?')}", font=_font(12), fill=MUTED)

    name = cat.get("name", "")[:30]
    draw.text((x0, PAD + 38), name, font=_font(21, bold=True), fill=TEXT)

    y = PAD + 78
    draw.line([(x0, y), (x0 + px - x0 - 10, y)], fill=SHADOW, width=1)
    y += 14

    desc = (cat.get("description", "") or "Sin descripción")[:65]
    draw.text((x0, y), desc, font=_font(12), fill=MUTED)
    y += 36

    _pill(draw, x0, y, "🗂️ Categoría", LAVENDER, TEXT)

    buf = io.BytesIO()
    base.save(buf, format="PNG")
    return buf.getvalue()


# ── API pública ───────────────────────────────────────────────────────────────

def render_articles(articles: list[dict]) -> list[bytes]:
    return [_render_article_card(a) for a in articles]

def render_categories(categories: list[dict]) -> list[bytes]:
    return [_render_category_card(c) for c in categories]

def render_single_article(article: dict) -> bytes:
    return _render_article_card(article)

def render_single_category(cat: dict) -> bytes:
    return _render_category_card(cat)
