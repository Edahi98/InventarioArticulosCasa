/**
 * Sincroniza todos los datos de Turso (libSQL) a Supabase (PostgreSQL).
 *
 * Requiere en .env:
 *   TURSO_DATABASE_URL — URL de Turso
 *   TURSO_AUTH_TOKEN  — token de Turso
 *   DATABASE_URL      — URL de PostgreSQL (Supabase)
 *
 * Uso:
 *   tsx src/scripts/syncToSupabase.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle as drizzleSqlite } from "drizzle-orm/libsql";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import * as sqliteSchema from "../db/schema.js";
import * as pgSchema from "../db/schema.pg.js";
import { sql } from "drizzle-orm";

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "",
  authToken: process.env.TURSO_AUTH_TOKEN ?? "",
});
const pgClient = postgres(process.env.DATABASE_URL ?? "", { max: 1 });

const src = drizzleSqlite(tursoClient, { schema: sqliteSchema });
const dst = drizzlePg(pgClient, { schema: pgSchema });

async function sync() {
  console.log("Leyendo datos de Turso...");

  const [categories, articles, notes, users] = await Promise.all([
    src.select().from(sqliteSchema.categories),
    src.select().from(sqliteSchema.articles),
    src.select().from(sqliteSchema.notes),
    src.select().from(sqliteSchema.users),
  ]);

  console.log(
    `  categorías: ${categories.length} | artículos: ${articles.length} | notas: ${notes.length} | usuarios: ${users.length}`
  );

  console.log("Limpiando Supabase...");
  await dst.delete(pgSchema.notes);
  await dst.delete(pgSchema.articles);
  await dst.delete(pgSchema.categories);
  await dst.delete(pgSchema.users);

  console.log("Insertando en Supabase...");

  if (categories.length) {
    await dst.insert(pgSchema.categories).values(
      categories.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt,
      }))
    );
    await dst.execute(sql`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`);
  }

  if (articles.length) {
    await dst.insert(pgSchema.articles).values(
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
    await dst.execute(sql`SELECT setval('articles_id_seq', (SELECT MAX(id) FROM articles))`);
  }

  if (notes.length) {
    await dst.insert(pgSchema.notes).values(
      notes.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        articleId: r.articleId,
        createdAt: r.createdAt,
      }))
    );
    await dst.execute(sql`SELECT setval('notes_id_seq', (SELECT MAX(id) FROM notes))`);
  }

  if (users.length) {
    await dst.insert(pgSchema.users).values(
      users.map((r) => ({
        id: r.id,
        username: r.username,
        passwordHash: r.passwordHash,
        createdAt: r.createdAt,
      }))
    );
    await dst.execute(sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  }

  console.log("✓ Sincronización completada.");
}

sync()
  .catch((err) => {
    console.error("✗ Error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    tursoClient.close();
    await pgClient.end();
  });
