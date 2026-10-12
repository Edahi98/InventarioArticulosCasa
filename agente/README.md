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

## Docker

Se construye y corre como parte del `docker-compose.yaml` de la raíz. No define `EXPOSE`
en su `Dockerfile`, pero escucha en `0.0.0.0:$PORT`.
