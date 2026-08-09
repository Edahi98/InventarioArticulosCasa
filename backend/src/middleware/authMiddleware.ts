import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { db } from "../db/client.js";
import { users } from "../db/schema/users.js";

export interface AuthTokenPayload {
  sub: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET no está configurado en el servidor.", 500);
  }
  return secret;
}

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

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;

    const [user] = await db.select().from(users).where(eq(users.id, Number(payload.sub)));
    if (!user) {
      next(new AppError("La sesión ya no es válida: el usuario fue eliminado.", 401));
      return;
    }

    req.auth = payload;
    next();
  } catch {
    next(new AppError("Token de autenticación inválido o expirado.", 401));
  }
}
