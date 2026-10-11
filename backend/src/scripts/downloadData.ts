import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { queryClient, db } from "../db/client.js";
import { dataTables } from "./dataTables.js";

/**
 * Baja todos los datos de Supabase (PostgreSQL) a un archivo JSON.
 *
 * Requiere `DATABASE_URL` en el .env.
 * Uso: `tsx src/scripts/downloadData.ts [archivo.json]` (por defecto ./backup.json).
 */
async function download(): Promise<void> {
  const file = process.argv[2] ?? "backup.json";
  console.log("Leyendo datos de Supabase...");

  const rows = await Promise.all(dataTables.map(({ table }) => db.select().from(table)));
  const data = Object.fromEntries(dataTables.map(({ name }, i) => [name, rows[i]]));

  console.log("  " + dataTables.map(({ name }, i) => `${name}: ${rows[i].length}`).join(" | "));

  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✓ Datos guardados en ${file}`);
}

download()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exitCode = 1;
  })
  .finally(() => queryClient.end());
