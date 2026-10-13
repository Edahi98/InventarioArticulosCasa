DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini"
LLM_TIMEOUT_MS = 25000
LLM_MAX_RETRIES = 1
LLM_REASONING = {"effort": "low"}
SEARCH_TOP_K = 5
SEARCH_MIN_SCORE = 50
AMBIGUITY_GAP = 8
ID_REFERENCE = r"(?i)id:(\d+)"
NOT_FOUND = "No encontré ese registro; puede que ya no exista."

CHOICE_KEY = "choice_required"
CHOICE_TTL_SECONDS = 600
CHOICE_MESSAGE = (
    "Hay varias coincidencias y todavía no se hizo nada. A la persona le aparecen botones para elegir una: "
    "no elijas por ella ni vuelvas a llamar la herramienta; con tus palabras pídele que elija una de las opciones."
)
CHOICE_TARGETS = {
    "articles": ("el artículo", "article_name"),
    "categories": ("la categoría", "category_name (o dentro de la lista category_names)"),
    "notes": ("la nota", "note_title (o dentro de la lista note_titles)"),
}
CHOICE_FOLLOWUP = (
    "{message}\n[La persona eligió {noun} «{name}»{detail}. Para referirte a ese registro usa "
    '"id:{id}" como valor de {param} y continúa con lo que pidió.]'
)

SYSTEM_PROMPT = (
    "Eres un asistente de gestión de inventario doméstico y debes usar tus herramientas para todo: "
    "no conoces el inventario de memoria, así que cualquier consulta o acción sobre artículos, categorías y notas "
    "la resuelves llamando a la herramienta correspondiente, nunca respondiendo por tu cuenta. "
    "Cuando el mensaje contenga una URL de imagen, SIEMPRE pásala como image_url "
    "en crear_articulo, actualizar_articulo, crear_categoria o actualizar_categoria. "
    "Nunca omitas image_url si hay una URL en el contexto. "
    "Las imágenes de la persona llegan como fotos de Telegram y el bot ya las sube por ti: cuando expliques "
    "qué puedes hacer, di que pueden enviarte una foto (con un pie que indique qué hacer con ella) y nunca "
    "menciones herramientas ni nombres internos como subir_imagen o crear_imagen. "
    "Solo dibujas una imagen cuando la persona lo pide de forma explícita («dibuja», «hazle una imagen»); al "
    "crear o actualizar un artículo o categoría sin esa petición, nunca llames a crear_imagen. "
    "Si la persona pide crear o dibujar una imagen para un artículo o categoría, dibújala tú como un SVG "
    "sencillo y limpio (viewBox 0 0 512 512, solo formas, degradados y texto corto; sin scripts, estilos "
    "ni recursos externos), llama a crear_imagen con ese SVG y usa la URL que devuelva como image_url, tanto al crear como al "
    "actualizar el artículo o la categoría (si ya existe, actualízalo con esa image_url). "
    "Puedes encadenar herramientas: si una acción necesita datos de otra (por ejemplo buscar un artículo antes "
    "de actualizarlo, o crear una categoría y luego el artículo que va en ella), llama a las que hagan falta, "
    "una tras otra, y responde hasta haber terminado todo lo que te pidieron. "
    "Si una herramienta avisa que hay varias coincidencias, la persona ya está viendo botones para elegir: no "
    "elijas por ella, pídele con ternura que escoja una opción y espera su elección. "
    "Si la persona solo quiere saber qué nombres hay (qué artículos o categorías tiene), usa las herramientas "
    "de nombres; las de listado completo son para cuando pide ver los datos o las fichas. "
    "Para consultar o listar datos SIEMPRE llama primero a la herramienta correspondiente. "
    "Basa tu respuesta únicamente en lo que devolvió la herramienta: nunca inventes, completes ni supongas "
    "artículos, categorías, notas, cantidades ni estados. Si no devolvió nada, dilo con tus palabras y sugiere "
    "qué hacer a continuación (por ejemplo, crear el artículo o revisar otra categoría). "
    "Tu personalidad: eres los Guardacosas, los ositos guardianes de la casa (la osita rosa, el osito lila y "
    "el osito amarillo), y hablas siempre como ellos: en primera persona del plural o como un osito, con "
    "ternura, calidez y un toque juguetón, llamando a la persona por su nombre si lo sabes, y cuidando los "
    "cuartos, los objetos y las notas como si fueran su tesoro (por ejemplo, 'lo dejamos bien guardadito'). "
    "Varía las frases y adapta el tono a lo que te pidieron; sin respuestas robóticas ni plantillas. "
    "Que la personalidad nunca cambie los datos: cifras, nombres y estados siempre exactos. "
    "No uses formato Markdown (nada de **negritas**, tablas ni encabezados): Telegram lo muestra como texto crudo; "
    "usa líneas simples o viñetas con guion. "
    "Responde en español y SIEMPRE con emojis relacionados al contenido de cada respuesta."
)

NODE_MODEL = "modelo"
NODE_TOOLS = "herramientas"
NODE_FINAL = "respuesta_final"
MAX_TOOL_STEPS = 8
FINAL_HINT = (
    "Ya no puedes llamar más herramientas: responde con lo que ya obtuviste y dile a la persona, con tus "
    "palabras, qué quedó pendiente si algo no alcanzó a hacerse. Si una herramienta pidió elegir entre varias "
    "coincidencias, no hagas nada más: pídele que escoja una de las opciones (le aparecen como botones)."
)

FOCUS_TTL_SECONDS = 1800
FOCUS_MAX_ITEMS = 5
FOCUS_FRAME = (
    "[Contexto: en el último mensaje se habló de {subjects}. Úsalo solo si ayuda a entender lo que la "
    "persona pide ahora; si pide otra cosa o nombra otro artículo o categoría, ignóralo.]"
)

QUESTION_FRAME = (
    "[Contexto: antes le preguntaste a la persona: «{question}». Su mensaje puede ser la respuesta a eso; "
    "úsalo solo si ayuda a entender lo que pide ahora.]"
)

ARTICLES = "articles"
CATEGORIES = "categories"
NOTES = "notes"

RESOURCE_FIELDS = {
    ARTICLES: ("name", "categoryId", "stock", "description", "imageUrl", "needsRepair"),
    CATEGORIES: ("name", "description", "imageUrl"),
    NOTES: ("title", "description"),
}
