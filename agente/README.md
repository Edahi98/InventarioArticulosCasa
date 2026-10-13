# agente

Agente conversacional (Flask + LangChain/LangGraph + OpenRouter) que actúa de intermediario
entre un cliente (CLI, API HTTP o bot de Telegram) y el backend de `InventarioArticulosCasa`, consumiendo su
API HTTP para consultar/editar artículos, categorías, notas e imágenes.

## Requisitos

- Python >= 3.11
- [uv](https://docs.astral.sh/uv/)
- Una API key de [OpenRouter](https://openrouter.ai) y un modelo con tool calling en `OPENROUTER_MODEL`

## Configuración

Copiar `.env.example` a `.env` y completar:

- `BACKEND_URL` — URL del backend de InventarioArticulosCasa (requerida)
- `OPENROUTER_API_KEY` — API key de OpenRouter (requerida)
- `OPENROUTER_MODEL` — modelo a usar (por defecto `openai/gpt-4o-mini`)
- `DECISIONS_MODEL` — modelo de la API de decisions de OpenRouter que filtra los mensajes (por defecto `typesafe/jev-1.13`). Si un mensaje no es para gestionar el inventario, no llega al agente y la persona espera 2 minutos
- `WEB_URL` — URL de la página web; el bot la menciona al pedir que vinculen la cuenta. El agente **no inicia sesión**: las personas vinculan su cuenta con un código que generan en la web (menú «Telegram») y envían al bot con `/vincular CÓDIGO`
- `INVENTARIO_TOKEN` — solo modo CLI: token obtenido al iniciar sesión en la web
- `MODE` — `telegram` (bot de Telegram), `server` (expone API HTTP) o `cli` (modo interactivo por terminal)
- `TELEGRAM_TOKEN` — token de BotFather (requerido con `MODE=telegram`)
- `PORT` — puerto del servidor Flask cuando `MODE=server`

## Uso

```bash
uv sync
uv run python main.py            # modo según MODE (por defecto CLI)
uv run python main.py telegram   # bot de Telegram
uv run python main.py server     # API HTTP
```

En modo servidor expone `GET /health`, `POST /chat` y `POST /upload`.

## Herramientas encadenadas

El agente es un grafo de LangGraph (`AgentBuilder`) con tres nodos: `modelo`, `herramientas` y `respuesta_final`.
Después del modelo, una arista condicional manda a `herramientas` si pidió tools o termina si respondió con texto;
después de las tools vuelve al modelo, que puede encadenar otra (buscar un artículo y luego actualizarlo, crear una
categoría y luego el artículo). Tras 8 rondas de tools en un mismo mensaje pasa a `respuesta_final`, que responde sin
más tools con lo que ya se obtuvo.

## Varias coincidencias

Si el nombre que da la persona coincide con varios artículos, categorías o notas (por ejemplo «taladro» con
«Taladro percutor» y «Taladro inalámbrico», o dos «Silla» en categorías distintas), la tool no actúa: el agente
le pide elegir y el bot de Telegram muestra un teclado con las opciones. Al pulsar una, el bot retoma la petición
original con ese registro (`id:N`). Las opciones caducan a los 10 minutos y un nombre idéntico y único se resuelve
sin preguntar.

## Imágenes dibujadas por el agente

Si la persona pide crear una imagen para un artículo o categoría, el agente la dibuja como SVG y la tool
`crear_imagen` la valida (`SvgGuard`: solo formas, degradados y texto; sin scripts ni recursos externos), la
convierte a PNG con [resvg](https://github.com/RazrFalcon/resvg) (`resvg-py`, sin dependencias nativas) y la
sube al backend. El texto dentro del SVG usa las fuentes del sistema; si la imagen debe llevar letras, el
contenedor necesita al menos una fuente instalada.

## Despliegue en Vercel (webhook de Telegram)

La API Flask corre como función de Vercel (`api/index.py` expone `app`, `vercel.json` fija carpeta y duración). Como
una función no es un proceso permanente, el bot recibe los mensajes por webhook en `POST /telegram/webhook` en lugar de
hacer polling, y el estado de la conversación vive en Postgres.

Variables del proyecto: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `DECISIONS_MODEL`, `BACKEND_URL`, `WEB_URL`,
`JWT_ISSUER`, `TELEGRAM_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (secreto que Telegram envía en cada actualización) y
`STATE_DATABASE_URL` (Postgres; crea el esquema `agente` aparte del `public` del backend). Sin `STATE_DATABASE_URL` el
estado queda en memoria, que es lo que usan el CLI, el servidor y el polling locales.

Registrar el webhook una vez desplegado (reemplaza el polling; `uv run python main.py telegram` lo quita al arrancar):

```bash
uv run python main.py webhook https://<dominio>/telegram/webhook
```

## Docker

Se construye y corre como parte del `docker-compose.yaml` de la raíz. No define `EXPOSE`
en su `Dockerfile`, pero escucha en `0.0.0.0:$PORT`.
