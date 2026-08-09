git add .gitignore docker-compose.yaml .env.example .agents/ .codegraph/ skills-lock.json
git commit -m "build: configuración inicial del repositorio e infraestructura"

git add docs/
git commit -m "docs: documentación de variables de entorno y usuarios"

git add supabase/
git commit -m "chore(db): scripts de inicialización de Supabase"

git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/drizzle.config.ts backend/drizzle.config.pg.ts backend/Dockerfile backend/.dockerignore backend/.env.example backend/.gitignore backend/entrypoint.sh backend/vercel.json
git commit -m "build(backend): configuración del proyecto y herramientas de Drizzle"

git add backend/src/db/ backend/drizzle/
git commit -m "feat(backend): definición de esquemas de base de datos y migraciones"

git add backend/src/storage/
git commit -m "feat(backend): adaptadores de almacenamiento externo (Cloudinary/FTP)"

git add backend/src/services/ backend/src/builders/
git commit -m "feat(backend): capa de servicios y utilidades (builders, validaciones)"

git add backend/src/middleware/ backend/src/token/ backend/src/verefiers/ backend/src/routes/authRoutes.ts
git commit -m "feat(backend): middlewares y lógica de autenticación"

git add backend/src/controllers/ backend/src/routes/
git commit -m "feat(backend): controladores y endpoints de la API"

git add backend/src/app.ts backend/src/server.ts backend/api/
git commit -m "feat(backend): configuración de servidor Express y entrada principal"

git add backend/src/scripts/
git commit -m "chore(backend): scripts de utilidad y migraciones de datos"

git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tailwind.config.js frontend/postcss.config.js frontend/Dockerfile frontend/.dockerignore frontend/.env.production frontend/.gitignore frontend/vercel.json frontend/tsconfig.json frontend/tsconfig.tsbuildinfo frontend/src/vite-env.d.ts
git commit -m "build(frontend): configuración de Vite, Tailwind y dependencias"

git add frontend/src/core/domain/ frontend/src/core/usecases/
git commit -m "feat(frontend): entidades de dominio y casos de uso (Core)"

git add frontend/src/infrastructure/ frontend/src/services/
git commit -m "feat(frontend): infraestructura HTTP y repositorios de datos"

git add frontend/src/components/ frontend/src/directives/
git commit -m "feat(frontend): componentes reutilizables de UI"

git add frontend/src/views/ frontend/src/router/
git commit -m "feat(frontend): enrutador y vistas principales"

git add frontend/src/App.vue frontend/src/main.ts frontend/src/assets/ frontend/index.html frontend/nginx.conf
git commit -m "feat(frontend): inicialización y estilos base de la aplicación"

git add agente/pyproject.toml agente/uv.lock agente/Dockerfile agente/README.md agente/.python-version agente/.env.example agente/.gitignore
git commit -m "build(agent): configuración de uv, dependencias y Dockerfile"

git add agente/src/domain/
git commit -m "feat(agent): entidades de dominio y puertos (interfaces)"

git add agente/src/infrastructure/
git commit -m "feat(agent): clientes HTTP externos e integración con backend"

git add agente/src/application/ agente/src/services/
git commit -m "feat(agent): capa de servicios de aplicación"

git add agente/src/agent/
git commit -m "feat(agent): herramientas y construcción del agente IA"

git add agente/src/api/ agente/main.py agente/src/__init__.py
git commit -m "feat(agent): rutas de FastAPI y entrada de la aplicación"

git add bot/pyproject.toml bot/uv.lock bot/Dockerfile bot/.python-version bot/.env.example bot/.gitignore bot/README.md
git commit -m "build(bot): configuración y entorno del bot"

git add bot/src/infrastructure/
git commit -m "feat(bot): cliente de comunicación con el agente"

git add bot/src/handlers/ bot/main.py bot/src/__init__.py
git commit -m "feat(bot): manejadores de mensajes de Telegram y entrada principal"

git add .
git commit -m "chore: archivos misceláneos restantes"
