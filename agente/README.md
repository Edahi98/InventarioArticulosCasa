# agente

Agente conversacional (Flask + LangChain/LangGraph + Ollama) que actúa de intermediario
entre un cliente (CLI o `bot/`) y el backend de `InventarioArticulosCasa`, consumiendo su
API HTTP para consultar/editar artículos, categorías, notas e imágenes.

## Requisitos

- Python >= 3.11
- [uv](https://docs.astral.sh/uv/)
- Un servidor Ollama accesible (local o remoto) con el modelo configurado en `OLLAMA_MODEL`

## Configuración

Copiar `.env.example` a `.env` y completar:

- `BACKEND_URL` — URL del backend de InventarioArticulosCasa (requerida)
- `OLLAMA_URL` / `OLLAMA_MODEL` — endpoint y modelo de Ollama
- `INVENTARIO_USER` / `INVENTARIO_PASS` — credenciales de login contra el backend (opcional; sin ellas, las requests van sin autenticar)
- `MODE` — `server` (expone API HTTP) o `cli` (modo interactivo por terminal)
- `PORT` — puerto del servidor Flask cuando `MODE=server`

## Uso

```bash
uv sync
uv run python main.py          # modo CLI
uv run python main.py server   # modo servidor (API HTTP), respeta MODE=server también
```

En modo servidor expone `GET /health` para chequeos de salud (usado por el `healthcheck`
del servicio `agente` en el `docker-compose.yaml` de la raíz del monorepo).

## Docker

Se construye y corre como parte del `docker-compose.yaml` de la raíz. No define `EXPOSE`
en su `Dockerfile`, pero escucha en `0.0.0.0:$PORT`.
