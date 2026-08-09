/**
 * Descarga imágenes del servidor FTP y las sube a Cloudinary.
 * Actualiza image_url en la base de datos activa (ENGINE).
 *
 * Requiere en .env:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   FTP_HOST, FTP_PORT, FTP_USER, FTP_PASS, FTP_FOLDER
 *   PUBLIC_URL  — base HTTP desde donde el backend sirve /files
 *   ENGINE / DATABASE_URL o TURSO_*
 *
 * Uso:
 *   tsx src/scripts/syncImagesToCloudinary.ts
 */
import "dotenv/config";
import { db, articles, categories } from "../db/client.js";
import { FtpAdapter } from "../storage/adapters/FtpAdapter.js";
import { CloudinaryAdapter } from "../storage/adapters/CloudinaryAdapter.js";
import * as ftp from "basic-ftp";
import { eq } from "drizzle-orm";
import { Readable } from "node:stream";
import path from "node:path";

const CLOUDINARY_TIMEOUT_MS = 15_000;
const DELAY_BETWEEN_FILES_MS = 700;

const ftpAdapter = new FtpAdapter();
const cloudinaryAdapter = new CloudinaryAdapter();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isFtpUrl(url: string, publicBaseUrl: string): boolean {
  return url.startsWith(publicBaseUrl);
}

function filenameFromFtpUrl(url: string): string {
  return url.split("/").pop() ?? "image.jpg";
}

async function downloadFromFtp(filename: string): Promise<Buffer> {
  const client = new ftp.Client(CLOUDINARY_TIMEOUT_MS);

  try {
    await client.access({
      host: process.env.FTP_HOST ?? "localhost",
      port: Number(process.env.FTP_PORT ?? 21),
      user: process.env.FTP_USER ?? "user",
      password: process.env.FTP_PASS ?? "user",
      secure: false,
    });

    const chunks: Buffer[] = [];
    const writable = new (await import("node:stream")).Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });

    const remotePath = path.posix.join(process.env.FTP_FOLDER ?? "/", filename);
    await client.downloadTo(writable, remotePath);
    return Buffer.concat(chunks);
  } finally {
    client.close();
  }
}

async function uploadToCloudinaryWithTimeout(buffer: Buffer, filename: string): Promise<{ id: string; url: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLOUDINARY_TIMEOUT_MS);
  try {
    return await cloudinaryAdapter.upload(buffer, filename);
  } finally {
    clearTimeout(timer);
  }
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
  const publicBase = (process.env.PUBLIC_URL ?? "http://localhost:4000").replace(/\/$/, "") + "/files/";
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.imageUrl || !row.imageUrl.startsWith(publicBase)) {
      skipped++;
      continue;
    }

    const filename = filenameFromFtpUrl(row.imageUrl);

    try {
      console.log(`  [${label} id=${row.id}] descargando desde FTP...`);
      const buffer = await downloadFromFtp(filename);

      console.log(`  [${label} id=${row.id}] subiendo a Cloudinary...`);
      const uploaded = await uploadToCloudinaryWithTimeout(buffer, filename);
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
  console.log("=== Sync FTP → Cloudinary ===\n");

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
