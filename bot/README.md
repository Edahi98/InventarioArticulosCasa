# bot

Bot de Telegram (`python-telegram-bot`) que expone el `agente/` como interfaz de chat
para consultar/editar el inventario desde Telegram.

## Requisitos

- Python >= 3.11
- [uv](https://docs.astral.sh/uv/)
- Un token de bot de Telegram (via [@BotFather](https://t.me/BotFather))
- El servicio `agente/` corriendo en modo `server`

## Configuración

Copiar `.env.example` a `.env` y completar:

- `TELEGRAM_TOKEN` — token del bot (requerido)
- `AGENT_URL` — URL del servicio `agente/` (requerido)

## Uso

```bash
uv sync
uv run python main.py
```

## Docker

Se construye y corre como parte del `docker-compose.yaml` de la raíz, esperando a que
`agente` esté saludable (`GET /health`) antes de arrancar.
