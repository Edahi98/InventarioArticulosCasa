# Variables de Entorno

Este documento lista todas las variables de entorno que deben configurarse en los distintos archivos `.env` (a partir de los `.env.example` de cada componente).

## Raíz (`/.env`)
Utilizadas principalmente por `docker-compose.yaml`.

* **`VITE_API_URL`** (Opcional): URL pública real del backend cuando se despliega fuera de localhost (ej. `https://mi-servidor.com:4000`).

## Backend (`/backend/.env`)
Configuración de la base de datos (Supabase), el almacenamiento de imágenes (Cloudinary) y el servidor del backend.

* **`PORT`**: Puerto del backend (ej. `3000`).
* **`DATABASE_URL`**: URL de conexión a Supabase (PostgreSQL), con la Connection Pooling URL.
* **`JWT_PRIVATE_KEY`**: Clave privada RSA (PEM en una línea, con `
`, **entre comillas dobles**) con la que el backend firma los tokens JWT (RS256). Se genera con `npm run keys:generate`. Su clave pública se publica en `/.well-known/jwks.json` y es la que usa el agente para verificar.
* **`JWT_ISSUER`** (Opcional): Emisor de los tokens (por defecto `inventario-backend`). Debe coincidir con el del agente.
* **`TELEGRAM_BOT_USERNAME`** (Opcional): usuario del bot de Telegram (sin `@`); la web lo usa para ofrecer el enlace directo de vinculación.
* **`TRUST_PROXY`** (Opcional): Saltos de proxy de confianza para obtener la IP del cliente (Vercel lo fija en `1`; `0` si no hay proxy).
* **`CLOUDINARY_URL`**: Credenciales de Cloudinary en una sola variable, con el formato `cloudinary://<api_key>:<api_secret>@<cloud_name>`.

## Agente (`/agente/.env`)
Configuración de la IA y conexión del agente inteligente.

* **`BACKEND_URL`**: URL de acceso al backend (ej. `http://inventario-backend:4000`). De ahí el agente descarga la clave pública para verificar los tokens (`/.well-known/jwks.json`).
* **`JWT_ISSUER`** (Opcional): Emisor esperado en los tokens (por defecto `inventario-backend`). Debe coincidir con el del backend.
* **`FORCE_HTTPS`** (Opcional): `true` para redirigir a HTTPS en modo `server`.
* **`OPENROUTER_API_KEY`**: API key de OpenRouter.
* **`OPENROUTER_MODEL`**: Modelo a utilizar, con soporte de tool calling (ej. `openai/gpt-4o-mini`).
* **`WEB_URL`**: URL pública de la página web; el bot la menciona al pedir que vinculen su cuenta. El agente no inicia sesión por sí mismo: cada persona genera un código en la web (menú «Telegram») y lo envía al bot con `/vincular CÓDIGO`.
* **`INVENTARIO_TOKEN`** (Opcional): solo para el modo `cli`; token obtenido al iniciar sesión en la web.
* **`MODE`**: Modo de ejecución: `telegram` (bot de Telegram), `server` (API HTTP) o `cli` (terminal).
* **`PORT`**: Puerto de la API cuando `MODE=server` (ej. `5000`).
* **`TELEGRAM_TOKEN`**: Token proporcionado por BotFather (requerido cuando `MODE=telegram`).
