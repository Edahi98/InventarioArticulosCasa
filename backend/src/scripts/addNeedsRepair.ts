import { createClient } from "@libsql/client";

async function main(): Promise<void> {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN ?? "",
  });

  await turso.execute(
    "ALTER TABLE articles ADD COLUMN needs_repair integer NOT NULL DEFAULT 0",
  );
  console.log("Columna needs_repair agregada correctamente.");
  turso.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
