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

# Sincronizar datos a Turso

Copia todos los datos de Supabase (local) a Turso (cloud) de forma destructiva — reemplaza todo lo que haya en Turso.

## Requisitos en `.env`

```env
DATABASE_URL=postgresql://...      # Supabase (origen)
TURSO_DATABASE_URL=libsql://...    # Turso (destino)
TURSO_AUTH_TOKEN=...
```

## Ejecutar

```bash
cd backend
npm run sync:turso
```

## Desde el contenedor Docker

```bash
docker exec inventario-backend node dist/src/scripts/syncToTurso.js
```

> **Advertencia:** el script borra todos los datos en Turso antes de insertar. No es incremental.

---

# Sincronizar datos a Supabase

Copia todos los datos de Turso (cloud) a Supabase (local) de forma destructiva.

## Ejecutar

```bash
cd backend
npm run sync:supabase
```

## Desde el contenedor Docker

```bash
docker exec inventario-backend node dist/src/scripts/syncToSupabase.js
```

> **Advertencia:** el script borra todos los datos en Supabase antes de insertar y reinicia las secuencias de IDs. No es incremental.

---

# Sincronizar imágenes entre Cloudinary y FTP

Los scripts detectan automáticamente qué registros pertenecen a cada origen y omiten los que ya están en el destino correcto.

> **Advertencia:** ambos scripts son destructivos en el destino — no son incrementales.

## Cloudinary → FTP

```bash
cd backend
npm run sync:images:ftp
```

## FTP → Cloudinary

```bash
cd backend
npm run sync:images:cloudinary
```

## Desde el contenedor Docker

```bash
docker exec inventario-backend node dist/src/scripts/syncImagesToFtp.js
docker exec inventario-backend node dist/src/scripts/syncImagesToCloudinary.js
```

---

# Ver archivos del servidor FTP

## Terminal

```bash
docker exec inventario-ftp ls /home/vsftpd/ftpuser
```

## FileZilla (cliente gráfico)

| Campo      | Valor       |
|------------|-------------|
| Host       | `localhost` |
| Usuario    | `ftpuser`   |
| Contraseña | `MiPassword`|
| Puerto     | `21`        |

## HTTP (mientras `STORAGE=ftp` esté activo)

```
http://localhost:4000/files/<nombre-archivo>
```
