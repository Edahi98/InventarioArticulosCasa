import jwt from "jsonwebtoken";
import { getJwtSecret } from "../middleware/authMiddleware.js";

export default class TokenIssuer {
  /**
   * Firma un token JWT de 8 horas.
   *
   * @param userId - Identificador del usuario.
   * @param username - Nombre de usuario.
   * @returns El token firmado.
   */
  issue(userId: number, username: string): string {
    return jwt.sign({ sub: String(userId), username }, getJwtSecret(), { expiresIn: "8h" });
  }
}