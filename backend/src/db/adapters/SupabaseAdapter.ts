import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema.pg.js";
import type { IDatabaseAdapter } from "./IDatabaseAdapter.js";

export class SupabaseAdapter implements IDatabaseAdapter {
  readonly db: ReturnType<typeof drizzle<typeof schema>>;

  constructor() {
    // prepare: false -- requerido para funcionar con el connection pooler de Supabase en modo
    // transacción (PgBouncer); sin esto, las prepared statements fallan intermitentemente en
    // entornos serverless donde cada invocación puede abrir una conexión nueva.
    const client = postgres(process.env.DATABASE_URL ?? "", { prepare: false });
    this.db = drizzle(client, { schema });
  }
}
