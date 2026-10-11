# Creación de usuarios

Los usuarios se crean directamente dentro del contenedor del backend. No hay endpoint HTTP expuesto para esto.

## Con Docker

```bash
docker exec inventario-backend node dist/src/scripts/createUser.js <username> <password>
```

**Ejemplo:**

```bash
docker exec inventario-backend node dist/src/scripts/createUser.js admin MiPassword123
```

## En desarrollo local

```bash
cd backend
npm run user:create -- <username> <password>
```

**Ejemplo:**

```bash
npm run user:create -- admin MiPassword123
```

---

# Bajar y subir datos

Respaldan y restauran la base de datos (Supabase) junto con sus imágenes (Cloudinary).

## Requisitos en `.env`

```env
DATABASE_URL=postgresql://...      # Supabase
CLOUDINARY_CLOUD_NAME=...          # solo para subir
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Bajar datos

```bash
cd backend
npm run data:download              # crea ./backup
npm run data:download -- ruta/otra # carpeta de destino opcional
```

Genera esta estructura:

```
backup/
├── data.json            # usuarios, categorías, artículos y notas
└── images/
    ├── categories-3.jpg # cada imagen se nombra <tabla>-<id>.<ext>
    ├── articles-12.png
    └── images.json      # a qué registro de la base de datos pertenece cada archivo
```

Cada entrada de `images.json` indica el archivo, la tabla, el id del registro, la columna y la URL original:

```json
{ "file": "articles-12.png", "table": "articles", "id": 12, "column": "imageUrl", "url": "https://res.cloudinary.com/..." }
```

## Subir datos

```bash
cd backend
npm run data:upload                # lee ./backup
npm run data:upload -- ruta/otra   # carpeta de origen opcional
```

Sube cada imagen de `images/` a Cloudinary, actualiza la URL del registro al que pertenece (según `images.json`) y reemplaza el contenido de las tablas conservando los ids.

> **Advertencia:** el script borra todos los datos en Supabase antes de insertar y reinicia las secuencias de ids. No es incremental.

> `backup/` contiene hashes de contraseñas: está en `.gitignore`, no la subas al repositorio.
