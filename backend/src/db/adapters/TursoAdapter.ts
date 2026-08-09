import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../schema.js";
import type { IDatabaseAdapter } from "./IDatabaseAdapter.js";

export class TursoAdapter implements IDatabaseAdapter {
  readonly db: ReturnType<typeof drizzle<typeof schema>>;

  constructor() {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? "",
      authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    });
    this.db = drizzle(client, { schema });
  }
}
