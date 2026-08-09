# Inventario Inteligente para el Hogar 🏠📦

Sistema integral para la gestión y seguimiento del inventario de artículos del hogar. Diseñado con una arquitectura de microservicios, permite administrar el inventario a través de una interfaz web intuitiva o interactuar mediante lenguaje natural utilizando un Bot de Telegram impulsado por un Agente de IA.

## 🌟 Características Principales
- **Dashboard Web**: Interfaz construida con Vue y Tailwind CSS para administrar artículos, categorías, notas y stock.
- **Asistente de IA (Agente)**: Un agente inteligente (Python) que permite hacer consultas semánticas y operaciones con lenguaje natural.
- **Bot de Telegram**: Interfaz conversacional accesible desde cualquier lugar para registrar o consultar el inventario rápidamente.
- **Almacenamiento Adaptable**: Soporte para bases de datos locales (PostgreSQL/Supabase) y Edge (Turso/libSQL), con soporte para imágenes (Cloudinary o FTP interno).
- **Gestión de Reportes**: Descarga y exportación de reportes de inventario a Excel.

## 🏗 Arquitectura del Sistema

El sistema sigue una arquitectura distribuida basada en contenedores, separando claramente las responsabilidades (Frontend, Backend, Agente IA y Bot):

```mermaid
graph TD
    %% Nodos de Interfaz de Usuario
    UserWeb(["Usuario Web"]) -->|HTTP/REST| Frontend
    UserBot(["Usuario Telegram"]) -->|Telegram API| Bot

    %% Componentes Principales
    subgraph "Capa de Presentación & IA"
        Frontend["Frontend Web<br/>(Vue, Vite, Tailwind)"]
        Bot["Bot de Telegram<br/>(Python)"]
        Agente["Agente de IA<br/>(FastAPI, LLM)"]
    end

    %% Capa de Backend
    subgraph "Capa de Servicios Core"
        Backend["Backend API<br/>(Node.js, Express, Drizzle)"]
    end

    %% Capa de Datos
    subgraph "Capa de Persistencia"
        DB[("Base de Datos<br/>Supabase / Turso")]
        Storage[("Almacenamiento<br/>Cloudinary / FTP")]
    end

    %% Conexiones
    Frontend -->|API REST| Backend
    Bot -->|API Interna| Agente
    Agente -->|Llamado a Herramientas| Backend
    Backend -->|ORM (Drizzle)| DB
    Backend -->|Uploads| Storage
    Agente -.->|Inferencia NLP| Ollama[(Motor LLM)]
```

## 🛠 Stack Tecnológico

*   **Frontend**: Vue 3, Vite, Tailwind CSS, TypeScript.
*   **Backend**: Node.js, Express, Drizzle ORM, TypeScript.
*   **Inteligencia Artificial**: Python, FastAPI, Ollama.
*   **Bot**: Python, Telegram API.
*   **Infraestructura**: Docker, Docker Compose, Nginx.

## 🚀 Despliegue Local

El proyecto incluye un `docker-compose.yaml` orquestado para levantar todo el stack con facilidad.

1. Configura las variables copiando los `.env.example` a `.env` en los distintos directorios (Ver la [Documentación de Variables de Entorno](./docs/variables-entorno.md)).
2. Levanta los servicios con Docker:
   ```bash
   docker compose up -d --build
   ```

## 📦 Estructura del Repositorio

*   `/backend`: API RESTful que administra la lógica de negocio y persistencia.
*   `/frontend`: Cliente web (SPA) para la gestión visual.
*   `/agente`: Servicio de inteligencia artificial que procesa intenciones y coordina respuestas.
*   `/bot`: Cliente conversacional de Telegram.
*   `/docs`: Guías y documentación técnica del proyecto.
*   `/supabase`: Scripts SQL de inicialización para el entorno de base de datos local.
