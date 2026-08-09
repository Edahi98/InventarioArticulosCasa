# Variables de Entorno

Este documento lista todas las variables de entorno que deben configurarse en los distintos archivos `.env` (a partir de los `.env.example` de cada componente).

## Raíz (`/.env`)
Utilizadas principalmente por `docker-compose.yaml`.

* **`PASV_ADDRESS`**: IP pública del host donde corre Docker. Requerida por el servicio FTP para el modo pasivo (ej. `203.0.113.10`).
* **`VITE_API_URL`** (Opcional): URL pública real del backend cuando se despliega fuera de localhost (ej. `https://mi-servidor.com:4000`).
* **`PUBLIC_URL`** (Opcional): URL pública para el sistema.

## Backend (`/backend/.env`)
Configuración de base de datos, almacenamiento y servidor del backend.

* **`PORT`**: Puerto del backend (ej. `3000`).
* **`ENGINE`**: Motor de base de datos a usar (`local` para Supabase PostgreSQL, `cloud` para Turso libSQL).
* **`TURSO_DATABASE_URL`**: URL de conexión para Turso (si `ENGINE=cloud`).
* **`TURSO_AUTH_TOKEN`**: Token de autenticación de Turso.
* **`DATABASE_URL`**: URL de conexión para Supabase (Connection Pooling URL) (si `ENGINE=local`).
* **`JWT_SECRET`**: Secreto para la firma de tokens JWT.
* **`STORAGE`**: Servicio de almacenamiento a usar (`cloudinary` o `ftp`).
* **`CLOUDINARY_CLOUD_NAME`**: Nombre del cloud en Cloudinary.
* **`CLOUDINARY_API_KEY`**: API Key de Cloudinary.
* **`CLOUDINARY_API_SECRET`**: API Secret de Cloudinary.
* **`FTP_HOST`**: Host del servidor FTP (solo si `STORAGE=ftp`).
* **`FTP_PORT`**: Puerto del FTP.
* **`FTP_USER`**: Usuario del FTP.
* **`FTP_PASS`**: Contraseña del FTP.
* **`FTP_FOLDER`**: Carpeta raíz del FTP.
* **`FTP_LOCAL_PATH`**: Ruta local donde se montan los archivos del FTP para servirlos como estáticos.
* **`PUBLIC_URL`**: URL pública base desde la que el backend sirve archivos estáticos.

## Agente (`/agente/.env`)
Configuración de la IA y conexión del agente inteligente.

* **`BACKEND_URL`**: URL de acceso al backend (ej. `http://inventario-backend:4000`).
* **`OLLAMA_URL`**: URL de acceso al servicio de Ollama (ej. `http://host.docker.internal:11434`).
* **`OLLAMA_MODEL`**: Modelo a utilizar por Ollama (ej. `llama3.2`).
* **`INVENTARIO_USER`**: Usuario administrador para el acceso del agente.
* **`INVENTARIO_PASS`**: Contraseña del administrador.
* **`MODE`**: Modo de ejecución del agente (ej. `server`).
* **`PORT`**: Puerto en el que expone la API el agente (ej. `5000`).

## Bot (`/bot/.env`)
Configuración del bot de Telegram.

* **`TELEGRAM_TOKEN`**: Token proporcionado por BotFather en Telegram.
* **`AGENT_URL`**: URL para comunicarse con el agente (ej. `http://inventario-agente:5000`).
