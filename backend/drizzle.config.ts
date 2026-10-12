import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  tablesFilter: ["users", "sessions", "link_codes", "categories", "articles", "notes"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
