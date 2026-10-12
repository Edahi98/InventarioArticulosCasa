# Inventario Inteligente para el Hogar 🏠📦

Sistema integral para la gestión y seguimiento del inventario de artículos del hogar. Diseñado con una arquitectura de microservicios, permite administrar el inventario a través de una interfaz web intuitiva o interactuar mediante lenguaje natural con un Agente de IA que también atiende por Telegram.

## 🌟 Características Principales
- **Dashboard Web**: Interfaz construida con Vue y Tailwind CSS para administrar artículos, categorías, notas y stock.
- **Asistente de IA (Agente)**: Un agente inteligente (Python) que permite hacer consultas por coincidencia aproximada y operaciones con lenguaje natural, desde la terminal, una API HTTP o un bot de Telegram integrado, accesible desde cualquier lugar.
- **Persistencia**: Base de datos en Supabase (PostgreSQL) e imágenes en Cloudinary.
- **Gestión de Reportes**: Descarga y exportación de reportes de inventario a Excel.

## 🏗 Arquitectura del Sistema

El sistema sigue una arquitectura distribuida basada en contenedores, separando claramente las responsabilidades (Frontend, Backend y Agente IA con su bot de Telegram):

```mermaid
graph TD
    %% Nodos de Interfaz de Usuario
    UserWeb(["Usuario Web"]) -->|HTTP/REST| Frontend
    UserBot(["Usuario Telegram"]) -->|Telegram API| Agente

    %% Componentes Principales
    subgraph "Capa de Presentación & IA"
        Frontend["Frontend Web<br/>(Vue, Vite, Tailwind)"]
        Agente["Agente de IA<br/>(LangGraph, Flask, bot de Telegram)"]
    end

    %% Capa de Backend
    subgraph "Capa de Servicios Core"
        Backend["Backend API<br/>(Node.js, Express, Drizzle)"]
    end

    %% Capa de Datos
    subgraph "Capa de Persistencia"
        DB[("Base de Datos<br/>Supabase")]
        Storage[("Almacenamiento<br/>Cloudinary")]
    end

    %% Conexiones
    Frontend -->|API REST| Backend
    Agente -->|Llamado a Herramientas| Backend
    Backend -->|ORM Drizzle| DB
    Backend -->|Uploads| Storage
    Agente -.->|Inferencia NLP| LLM[("OpenRouter")]
```

## 🛠 Stack Tecnológico

*   **Frontend**: Vue 3, Vite, Tailwind CSS, TypeScript.
*   **Backend**: Node.js, Express, Drizzle ORM, TypeScript.
*   **Inteligencia Artificial**: Python, LangChain/LangGraph, OpenRouter.
*   **Infraestructura**: Docker, Docker Compose, Nginx.

## 🚀 Despliegue Local

El proyecto incluye un `docker-compose.yaml` orquestado para levantar todo el stack con facilidad.

1. Configura las variables copiando los `.env.example` a `.env` en los distintos directorios (Ver la [Documentación de Variables de Entorno](./docs/variables-entorno.md)).
2. Levanta los servicios con Docker:
   ```bash
   docker compose up -d --build
   ```

## 🧰 Desarrollo con Turborepo

El monorepo usa npm workspaces (`frontend`, `backend`, `agente`) orquestados con Turborepo. Desde la raíz:

```bash
npm install            # instala todos los workspaces
npm run dev            # levanta frontend, backend y agente en paralelo
npm run build          # compila frontend y backend (con caché)
npm run typecheck      # revisa tipos de frontend y backend y sintaxis del agente
```

Las imágenes de `backend` y `frontend` se construyen desde la raíz del repositorio: cada `Dockerfile` usa `turbo prune <paquete> --docker` para copiar solo los paquetes que necesita y reutilizar la caché de dependencias.

## 📦 Estructura del Repositorio

*   `/backend`: API RESTful que administra la lógica de negocio y persistencia.
*   `/frontend`: Cliente web (SPA) para la gestión visual.
*   `/agente`: Servicio de inteligencia artificial que procesa intenciones y coordina respuestas; incluye el bot de Telegram.
*   `/docs`: Guías y documentación técnica del proyecto.
*   `/supabase`: Scripts SQL de inicialización para el entorno de base de datos local.
