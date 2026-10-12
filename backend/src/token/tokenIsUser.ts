import jwt from "jsonwebtoken";
import { JWT_ALGORITHM, JWT_ISSUER, TOKEN_AUDIENCES, TOKEN_TTL_SECONDS } from "./jwtConfig.js";
import { jwtKeys } from "./jwtKeys.js";

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export default class TokenIssuer {
  /**
   * Firma con RS256 un token JWT. Lleva quién es el usuario (`sub`, `username`), quién lo emitió
   * (`iss`), para qué APIs es (`aud`: backend y agente) y cuándo expira (`exp`).
   *
   * @param userId - Identificador del usuario.
   * @param username - Nombre de usuario.
   * @param ttlSeconds - Vigencia del token en segundos (1 hora por defecto).
   * @returns El token firmado y el momento en que expira.
   * @throws AppError 500 si el servidor no tiene configurada su clave privada.
   */
  issue(userId: number, username: string, ttlSeconds: number = TOKEN_TTL_SECONDS): IssuedToken {
    const token = jwt.sign({ username }, jwtKeys.privateKey(), {
      algorithm: JWT_ALGORITHM,
      keyid: jwtKeys.keyId(),
      issuer: JWT_ISSUER,
      audience: TOKEN_AUDIENCES,
      subject: String(userId),
      expiresIn: ttlSeconds,
    });
    return { token, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  }
}
