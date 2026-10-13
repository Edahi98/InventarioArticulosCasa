MAX_ALBUM = 10
CAPTION_LIMIT = 1024
BEAR_FILE = "oso_guardian.png"

CHOICE_CALLBACK = "pick"
CHOICE_PATTERN = r"^pick:\d{1,2}$"
CHOICE_LABEL_LIMIT = 60
CHOICE_PROMPT = "🐻🔎 Encontramos varias coincidencias, ¿cuál de estas es? 👇"
CHOICE_EXPIRED = "🐻⌛ Esa elección ya caducó. Vuelve a pedirnos lo que querías y lo hacemos de nuevo 💗"

PROCESSING ="🐻⏳ Los ositos lo están revisando..."
UPLOADING = "🐻📸 Guardando tu foto..."

PHOTO_WITH_CAPTION = (
    "{caption}\n\n"
    'Imagen subida. Usa image_url="{url}" en la herramienta correspondiente.'
)
PHOTO_WITHOUT_CAPTION = (
    'El usuario envió una imagen. image_url="{url}". '
    "Pregúntale para qué artículo o categoría es, y cuando actúes usa ese image_url."
)

WELCOME = (
    "🐻👋 ¡Hola! Somos los Guardacosas, los ositos que cuidan tu inventario.\n\n"
    "Para empezar, vincula tu cuenta desde la página web:\n"
    "1. Inicia sesión en {web_url}\n"
    "2. Abre «Telegram» en el menú y genera un código\n"
    "3. Envíamelo aquí: /vincular CÓDIGO"
)
LINK_REQUIRED = (
    "🐻🔒 Ay, perdoncito... somos los ositos guardianes de esta casa y no podemos confiar en personas "
    "desconocidas 🥺💗 Todavía no te conocemos, pero si vinculas tu cuenta desde la página web seremos amiguitos:\n"
    "1. Inicia sesión en {web_url}\n"
    "2. Abre «Telegram» en el menú y genera un código\n"
    "3. Envíamelo aquí: /vincular CÓDIGO"
)
LINKING = "🐻⏳ Vinculando tu cuenta..."
LINKED = "🐻✅ ¡Listo, {username}! Ya puedes pedirnos cosas de tu inventario. Usa /salir para cerrar la sesión."
LOGGED_OUT = "🐻👋 Sesión cerrada, ¡te vamos a extrañar! 🥺 Para volver, genera un código nuevo en la página web."
NOT_LINKED = "🐻🥺 Todavía no te conocemos, y los guardianes no podemos confiar en desconocidos... 💗 Vincula tu cuenta primero."
IMAGE_ERROR = "🐻😢 Uy, no pudimos procesar tu imagen: {error}"
LINK_ERROR = "🐻😢 No pudimos vincular tu cuenta: {error}"
AGENT_ERROR = "🐻😢 Algo salió mal al contactar al agente: {error}"
INVALID_INPUT = "🐻🥺 Hmm, no entendimos eso. {details}"
