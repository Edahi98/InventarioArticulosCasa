MAX_ALBUM = 10

PROCESSING = "⏳ Procesando..."
UPLOADING = "⏳ Subiendo imagen..."

PHOTO_WITH_CAPTION = (
    "{caption}\n\n"
    'Imagen subida. Usa image_url="{url}" en la herramienta correspondiente.'
)
PHOTO_WITHOUT_CAPTION = (
    'El usuario envió una imagen. image_url="{url}". '
    "Pregúntale para qué artículo o categoría es, y cuando actúes usa ese image_url."
)

WELCOME = (
    "👋 Soy el asistente de tu inventario.\n\n"
    "Para empezar, vincula tu cuenta desde la página web:\n"
    "1. Inicia sesión en {web_url}\n"
    "2. Abre «Telegram» en el menú y genera un código\n"
    "3. Envíamelo aquí: /vincular CÓDIGO"
)
LINK_REQUIRED = (
    "🔒 Primero vincula tu cuenta desde la página web:\n"
    "1. Inicia sesión en {web_url}\n"
    "2. Abre «Telegram» en el menú y genera un código\n"
    "3. Envíamelo aquí: /vincular CÓDIGO"
)
LINKING = "⏳ Vinculando tu cuenta..."
LINKED = "✅ Listo, {username}. Ya puedes pedirme cosas de tu inventario. Usa /salir para cerrar la sesión."
LOGGED_OUT = "👋 Sesión cerrada. Para volver a usarme, genera un código nuevo en la página web."
NOT_LINKED = "No tienes una cuenta vinculada."
