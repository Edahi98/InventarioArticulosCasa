import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export default class UserCredentialsVerifier {
  /**
   * Comprueba las credenciales contra la base de datos.
   *
   * @param username - Nombre de usuario.
   * @param password - Contraseña en texto plano.
   * @returns El id y el nombre del usuario.
   * @throws AppError 401 si el usuario no existe o la contraseña no coincide.
   */
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