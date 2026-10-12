import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { sessionService } from "../services/sessionService.js";

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
 * Lee el secreto con el que se firman los tokens.
 *
 * @returns El valor de `JWT_SECRET`.
 * @throws AppError 500 si no está configurado.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET no está configurado en el servidor.", 500);
  }
  return secret;
}

/**
 * Exige un token `Bearer` con firma válida y una sesión vigente en la base de datos.
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
    payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
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
