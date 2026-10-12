import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

export const queryClient = postgres(process.env.DATABASE_URL ?? "", { prepare: false });

export const db = drizzle(queryClient, { schema });

export const { articles, categories, notes, users, sessions } = schema;
