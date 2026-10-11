import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { queryClient, db } from "../db/client.js";
import {
  dataTables,
  DATA_FILE,
  IMAGES_DIR,
  IMAGES_MANIFEST,
  IMAGE_COLUMN,
  type ImageEntry,
} from "./dataTables.js";

/**
 * Descarga una imagen a la carpeta de respaldo.
 *
 * @param url - URL pública de la imagen (Cloudinary).
 * @param file - Nombre con el que se guarda, sin extensión.
 * @param dir - Carpeta donde se guarda.
 * @returns El nombre final del archivo (con extensión), o `null` si la descarga falla.
 */
async function downloadImage(url: string, file: string, dir: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const extension = path.extname(new URL(url).pathname) || ".jpg";
    const fileName = `${file}${extension}`;
    await writeFile(path.join(dir, fileName), Buffer.from(await response.arrayBuffer()));
    return fileName;
  } catch (error) {
    console.warn(`  ! No se pudo descargar ${url}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Baja todos los datos de Supabase (PostgreSQL) a una carpeta de respaldo.
 *
 * La carpeta contiene `data.json` con todas las tablas, e `images/` con cada imagen
 * (`<tabla>-<id>.<ext>`) y un `images.json` que indica a qué registro de la base de datos
 * pertenece cada archivo (tabla, id, columna y URL original).
 *
 * Requiere `DATABASE_URL` en el .env.
 * Uso: `tsx src/scripts/downloadData.ts [carpeta]` (por defecto ./backup).
 */
async function download(): Promise<void> {
  const dir = process.argv[2] ?? "backup";
  const imagesDir = path.join(dir, IMAGES_DIR);
  await mkdir(imagesDir, { recursive: true });

  console.log("Leyendo datos de Supabase...");
  const rows = await Promise.all(dataTables.map(({ table }) => db.select().from(table)));
  const data = Object.fromEntries(dataTables.map(({ name }, i) => [name, rows[i]]));
  console.log("  " + dataTables.map(({ name }, i) => `${name}: ${rows[i].length}`).join(" | "));

  console.log("Descargando imágenes...");
  const manifest: ImageEntry[] = [];
  for (const [name, tableRows] of Object.entries(data)) {
    for (const row of tableRows as Record<string, unknown>[]) {
      const url = row[IMAGE_COLUMN];
      if (typeof url !== "string" || !url) {
        continue;
      }
      const id = row.id as number;
      const file = await downloadImage(url, `${name}-${id}`, imagesDir);
      if (file) {
        manifest.push({ file, table: name, id, column: IMAGE_COLUMN, url });
      }
    }
  }

  await writeFile(path.join(dir, DATA_FILE), JSON.stringify(data, null, 2), "utf-8");
  await writeFile(path.join(imagesDir, IMAGES_MANIFEST), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✓ Datos en ${path.join(dir, DATA_FILE)} e imágenes en ${imagesDir} (${manifest.length})`);
}

download()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exitCode = 1;
  })
  .finally(() => queryClient.end());
