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
- `INVENTARIO_USER` / `INVENTARIO_PASS` — credenciales de login contra el backend (opcional; sin ellas, las requests van sin autenticar)
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
