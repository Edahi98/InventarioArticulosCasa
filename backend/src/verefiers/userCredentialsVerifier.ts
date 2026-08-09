import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export default class UserCredentialsVerifier {
  async verify(username: string, password: string): Promise<{ id: number; username: string }> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      throw new AppError("Usuario o contraseña incorrectos.", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Usuario o contraseña incorrectos.", 401);
    }

    return { id: user.id, username: user.username };
  }
}