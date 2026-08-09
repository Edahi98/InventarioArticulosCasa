import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { IDatabaseAdapter } from "./adapters/IDatabaseAdapter.js";
import * as sqliteSchema from "./schema.js";
import * as pgSchema from "./schema.pg.js";

const engine = (process.env.ENGINE ?? "cloud") as "local" | "cloud";

const adapter: IDatabaseAdapter =
  engine === "local"
    ? new (await import("./adapters/SupabaseAdapter.js")).SupabaseAdapter()
    : new (await import("./adapters/TursoAdapter.js")).TursoAdapter();

export const db = adapter.db as LibSQLDatabase<typeof sqliteSchema>;

// Active schema tables — use these in services instead of importing from schema.ts directly.
// Ensures the correct column type mappers (SQLite vs PG) are used with the active adapter.
const activeSchema = engine === "local" ? pgSchema : sqliteSchema;
export const { articles, categories, notes, users } = activeSchema as unknown as typeof sqliteSchema;
