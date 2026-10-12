import jwt from "jsonwebtoken";
import { getJwtSecret } from "../middleware/authMiddleware.js";

const TOKEN_TTL_SECONDS = 60 * 60;

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export default class TokenIssuer {
  /**
   * Firma un token JWT de 1 hora.
   *
   * @param userId - Identificador del usuario.
   * @param username - Nombre de usuario.
   * @returns El token firmado y el momento en que expira.
   */
  issue(userId: number, username: string): IssuedToken {
    const token = jwt.sign({ sub: String(userId), username }, getJwtSecret(), {
      expiresIn: TOKEN_TTL_SECONDS,
    });
    return { token, expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000) };
  }
}
