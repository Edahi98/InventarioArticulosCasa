# Variables de Entorno

Este documento lista todas las variables de entorno que deben configurarse en los distintos archivos `.env` (a partir de los `.env.example` de cada componente).

## Raíz (`/.env`)
Utilizadas principalmente por `docker-compose.yaml`.

* **`VITE_API_URL`** (Opcional): URL pública real del backend cuando se despliega fuera de localhost (ej. `https://mi-servidor.com:4000`).

## Backend (`/backend/.env`)
Configuración de la base de datos (Supabase), el almacenamiento de imágenes (Cloudinary) y el servidor del backend.

* **`PORT`**: Puerto del backend (ej. `3000`).
* **`DATABASE_URL`**: URL de conexión a Supabase (PostgreSQL), con la Connection Pooling URL.
* **`JWT_SECRET`**: Secreto para la firma de tokens JWT.
* **`CLOUDINARY_URL`**: Credenciales de Cloudinary en una sola variable, con el formato `cloudinary://<api_key>:<api_secret>@<cloud_name>`.

## Agente (`/agente/.env`)
Configuración de la IA y conexión del agente inteligente.

* **`BACKEND_URL`**: URL de acceso al backend (ej. `http://inventario-backend:4000`).
* **`OPENROUTER_API_KEY`**: API key de OpenRouter.
* **`OPENROUTER_MODEL`**: Modelo a utilizar, con soporte de tool calling (ej. `openai/gpt-4o-mini`).
* **`INVENTARIO_USER`**: Usuario administrador para el acceso del agente.
* **`INVENTARIO_PASS`**: Contraseña del administrador.
* **`MODE`**: Modo de ejecución: `telegram` (bot de Telegram), `server` (API HTTP) o `cli` (terminal).
* **`PORT`**: Puerto de la API cuando `MODE=server` (ej. `5000`).
* **`TELEGRAM_TOKEN`**: Token proporcionado por BotFather (requerido cuando `MODE=telegram`).
