import "dotenv/config";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { queryClient, db } from "../db/client.js";
import { dataTables } from "./dataTables.js";

/**
 * Sube a Supabase (PostgreSQL) los datos de un archivo JSON generado por downloadData.ts.
 * Reemplaza el contenido actual de las tablas, conserva los ids originales y reinicia las secuencias.
 *
 * Requiere `DATABASE_URL` en el .env.
 * Uso: `tsx src/scripts/uploadData.ts [archivo.json]` (por defecto ./backup.json).
 */
async function upload(): Promise<void> {
  const file = process.argv[2] ?? "backup.json";
  const data: Record<string, Record<string, unknown>[]> = JSON.parse(await readFile(file, "utf-8"));

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

  console.log(`✓ Datos subidos desde ${file}`);
}

upload()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exitCode = 1;
  })
  .finally(() => queryClient.end());
