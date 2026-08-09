/**
 * Sincroniza todos los datos de Supabase (PostgreSQL) a Turso (libSQL).
 *
 * Requiere en .env:
 *   DATABASE_URL      — URL de PostgreSQL (Supabase)
 *   TURSO_DATABASE_URL — URL de Turso
 *   TURSO_AUTH_TOKEN  — token de Turso
 *
 * Uso:
 *   tsx src/scripts/syncToTurso.ts
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { createClient } from "@libsql/client";
import { drizzle as drizzleSqlite } from "drizzle-orm/libsql";
import * as pgSchema from "../db/schema.pg.js";
import * as sqliteSchema from "../db/schema.js";

const pgClient = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "",
  authToken: process.env.TURSO_AUTH_TOKEN ?? "",
});

const src = drizzlePg(pgClient, { schema: pgSchema });
const dst = drizzleSqlite(tursoClient, { schema: sqliteSchema });

async function sync() {
  console.log("Leyendo datos de Supabase...");

  const [categories, articles, notes, users] = await Promise.all([
    src.select().from(pgSchema.categories),
    src.select().from(pgSchema.articles),
    src.select().from(pgSchema.notes),
    src.select().from(pgSchema.users),
  ]);

  console.log(
    `  categorías: ${categories.length} | artículos: ${articles.length} | notas: ${notes.length} | usuarios: ${users.length}`
  );

  console.log("Limpiando Turso...");
  // Orden inverso de dependencias para respetar FK
  await dst.delete(sqliteSchema.notes);
  await dst.delete(sqliteSchema.articles);
  await dst.delete(sqliteSchema.categories);
  await dst.delete(sqliteSchema.users);

  console.log("Insertando en Turso...");

  if (categories.length) {
    await dst.insert(sqliteSchema.categories).values(
      categories.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt,
      }))
    );
  }

  if (articles.length) {
    await dst.insert(sqliteSchema.articles).values(
      articles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        stock: r.stock,
        needsRepair: r.needsRepair,
        categoryId: r.categoryId,
        createdAt: r.createdAt,
      }))
    );
  }

  if (notes.length) {
    await dst.insert(sqliteSchema.notes).values(
      notes.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        articleId: r.articleId,
        createdAt: r.createdAt,
      }))
    );
  }

  if (users.length) {
    await dst.insert(sqliteSchema.users).values(
      users.map((r) => ({
        id: r.id,
        username: r.username,
        passwordHash: r.passwordHash,
        createdAt: r.createdAt,
      }))
    );
  }

  console.log("✓ Sincronización completada.");
}

sync()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await pgClient.end();
    tursoClient.close();
  });
