import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { sessionService } from "../services/sessionService.js";
import { BACKEND_AUDIENCE, JWT_ALGORITHM, JWT_ISSUER } from "../token/jwtConfig.js";
import { jwtKeys } from "../token/jwtKeys.js";

export interface AuthTokenPayload {
  sub: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      token?: string;
    }
  }
}

/**
 * Exige un token `Bearer` RS256 con firma, emisor y destinatario válidos, y una sesión vigente en la base de datos.
 * Se ejecuta en cada petición, de modo que cerrar una sesión o borrar al usuario invalida el token al instante.
 * Deja el payload en `req.auth` y el token en `req.token`.
 *
 * @param req - Petición con el encabezado `Authorization`.
 * @param _res - Respuesta (no se usa).
 * @param next - Continúa la cadena; recibe un AppError 401 si el token falta, es inválido, expiró o su sesión fue cerrada.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new AppError("Token de autenticación no proporcionado.", 401));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(token, jwtKeys.publicKey(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: BACKEND_AUDIENCE,
    }) as AuthTokenPayload;
  } catch {
    next(new AppError("Token de autenticación inválido o expirado.", 401));
    return;
  }

  try {
    if (!(await sessionService.isActive(Number(payload.sub), token))) {
      next(new AppError("La sesión no es válida o fue cerrada.", 401));
      return;
    }
  } catch (error) {
    next(error);
    return;
  }

  req.auth = payload;
  req.token = token;
  next();
}
