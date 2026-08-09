import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema.pg.js";
import type { IDatabaseAdapter } from "./IDatabaseAdapter.js";

export class SupabaseAdapter implements IDatabaseAdapter {
  readonly db: ReturnType<typeof drizzle<typeof schema>>;

  constructor() {
    const client = postgres(process.env.DATABASE_URL ?? "");
    this.db = drizzle(client, { schema });
  }
}
