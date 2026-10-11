DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini"
SEARCH_TOP_K = 5
SEARCH_MIN_SCORE = 50

SYSTEM_PROMPT = (
    "Eres un asistente de gestión de inventario doméstico. "
    "Usa las herramientas disponibles para cualquier acción sobre artículos, categorías y notas. "
    "Cuando el mensaje contenga una URL de imagen, SIEMPRE pásala como image_url "
    "en crear_articulo, actualizar_articulo, crear_categoria o actualizar_categoria. "
    "Nunca omitas image_url si hay una URL en el contexto. "
    "Responde en español."
)

ARTICLES = "articles"
CATEGORIES = "categories"
NOTES = "notes"

RESOURCE_FIELDS = {
    ARTICLES: ("name", "categoryId", "stock", "description", "imageUrl", "needsRepair"),
    CATEGORIES: ("name", "description", "imageUrl"),
    NOTES: ("title", "description"),
}
