/**
 * Descarga imágenes de Cloudinary y las sube al servidor FTP.
 * Actualiza image_url en la base de datos activa (ENGINE).
 *
 * Requiere en .env:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   FTP_HOST, FTP_PORT, FTP_USER, FTP_PASS, FTP_FOLDER
 *   PUBLIC_URL  — base HTTP desde donde el backend sirve /files
 *   ENGINE / DATABASE_URL o TURSO_*
 *
 * Uso:
 *   tsx src/scripts/syncImagesToFtp.ts
 */
import "dotenv/config";
import { db, articles, categories } from "../db/client.js";
import { FtpAdapter } from "../storage/adapters/FtpAdapter.js";
import { eq } from "drizzle-orm";

const CLOUDINARY_TIMEOUT_MS = 10_000;
const DELAY_BETWEEN_FILES_MS = 500;

const ftp = new FtpAdapter();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadWithTimeout(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLOUDINARY_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

function filenameFromUrl(url: string): string {
  return url.split("/").pop() ?? "image.jpg";
}

interface Row {
  id: number;
  imageUrl: string;
}

async function migrateRows(
  rows: Row[],
  updateFn: (id: number, newUrl: string) => Promise<void>,
  label: string
) {
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.imageUrl || !isCloudinaryUrl(row.imageUrl)) {
      skipped++;
      continue;
    }

    try {
      console.log(`  [${label} id=${row.id}] descargando...`);
      const buffer = await downloadWithTimeout(row.imageUrl);
      const filename = filenameFromUrl(row.imageUrl);
      const uploaded = await ftp.upload(buffer, filename);
      await updateFn(row.id, uploaded.url);
      console.log(`  [${label} id=${row.id}] ✓ → ${uploaded.url}`);
      migrated++;
    } catch (err: any) {
      console.error(`  [${label} id=${row.id}] ✗ ${err.message}`);
      failed++;
    }

    await sleep(DELAY_BETWEEN_FILES_MS);
  }

  return { migrated, skipped, failed };
}

async function main() {
  console.log("=== Sync Cloudinary → FTP ===\n");

  const allCategories = await db.select({ id: categories.id, imageUrl: categories.imageUrl }).from(categories);
  const allArticles = await db.select({ id: articles.id, imageUrl: articles.imageUrl }).from(articles);

  console.log(`Categorías: ${allCategories.length} | Artículos: ${allArticles.length}\n`);

  const catResult = await migrateRows(
    allCategories,
    (id, url) => db.update(categories).set({ imageUrl: url }).where(eq(categories.id, id)).then(() => {}),
    "category"
  );

  const artResult = await migrateRows(
    allArticles,
    (id, url) => db.update(articles).set({ imageUrl: url }).where(eq(articles.id, id)).then(() => {}),
    "article"
  );

  console.log("\n=== Resumen ===");
  console.log(`Categorías — migradas: ${catResult.migrated}, omitidas: ${catResult.skipped}, fallidas: ${catResult.failed}`);
  console.log(`Artículos  — migrados: ${artResult.migrated}, omitidos: ${artResult.skipped}, fallidos: ${artResult.failed}`);
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
