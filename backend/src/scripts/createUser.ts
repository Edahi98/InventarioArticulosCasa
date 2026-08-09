import bcrypt from "bcryptjs";
import { db, users } from "../db/client.js";

async function main(): Promise<void> {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Uso: tsx src/scripts/createUser.ts <username> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ username, passwordHash });
  console.log(`Usuario "${username}" creado correctamente.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
