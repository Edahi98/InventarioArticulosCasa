import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { queryClient, db } from "../db/client.js";
import { cloudinaryService } from "../services/cloudinaryService.js";
import {
  dataTables,
  DATA_FILE,
  IMAGES_DIR,
  IMAGES_MANIFEST,
  type ImageEntry,
} from "./dataTables.js";

type Rows = Record<string, unknown>[];

/**
 * Lee el manifiesto de imágenes de la carpeta de respaldo.
 *
 * @param imagesDir - Carpeta `images/` del respaldo.
 * @returns Las imágenes registradas, o una lista vacía si no hay manifiesto.
 */
async function readManifest(imagesDir: string): Promise<ImageEntry[]> {
  try {
    return JSON.parse(await readFile(path.join(imagesDir, IMAGES_MANIFEST), "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Sube a Cloudinary las imágenes del respaldo y actualiza la URL de los registros a los que pertenecen.
 * Si una imagen no puede subirse, el registro conserva su URL original.
 *
 * @param data - Filas del respaldo por tabla; se modifican en el lugar.
 * @param manifest - Relación archivo → registro (tabla, id, columna).
 * @param imagesDir - Carpeta `images/` del respaldo.
 * @returns Cuántas imágenes se subieron.
 */
async function restoreImages(data: Record<string, Rows>, manifest: ImageEntry[], imagesDir: string): Promise<number> {
  let uploaded = 0;
  for (const entry of manifest) {
    const row = data[entry.table]?.find((candidate) => candidate.id === entry.id);
    if (!row) {
      continue;
    }
    try {
      const buffer = await readFile(path.join(imagesDir, entry.file));
      row[entry.column] = (await cloudinaryService.uploadFromBuffer(buffer)).url;
      uploaded += 1;
    } catch (error) {
      console.warn(`  ! No se pudo subir ${entry.file}: ${(error as Error).message}`);
    }
  }
  return uploaded;
}

/**
 * Sube a Supabase (PostgreSQL) los datos de una carpeta generada por downloadData.ts.
 * Reemplaza el contenido actual de las tablas, conserva los ids originales, reinicia las secuencias
 * y vuelve a subir las imágenes a Cloudinary actualizando la URL de cada registro.
 *
 * Requiere `DATABASE_URL` y `CLOUDINARY_URL` en el .env.
 * Uso: `tsx src/scripts/uploadData.ts [carpeta]` (por defecto ./backup).
 */
async function upload(): Promise<void> {
  const dir = process.argv[2] ?? "backup";
  const imagesDir = path.join(dir, IMAGES_DIR);
  const data: Record<string, Rows> = JSON.parse(await readFile(path.join(dir, DATA_FILE), "utf-8"));

  console.log("Subiendo imágenes a Cloudinary...");
  const uploaded = await restoreImages(data, await readManifest(imagesDir), imagesDir);
  console.log(`  imágenes subidas: ${uploaded}`);

  console.log("Limpiando Supabase...");
  for (const { table } of [...dataTables].reverse()) {
    await db.delete(table);
  }

  console.log("Insertando en Supabase...");
  for (const { name, table } of dataTables) {
    const rows = data[name] ?? [];
    if (!rows.length) {
      continue;
    }
    await db.insert(table).values(rows as (typeof table.$inferInsert)[]);
    await db.execute(sql.raw(`SELECT setval('${name}_id_seq', (SELECT MAX(id) FROM ${name}))`));
    console.log(`  ${name}: ${rows.length}`);
  }

  console.log(`✓ Datos subidos desde ${dir}`);
}

upload()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exitCode = 1;
  })
  .finally(() => queryClient.end());
