import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { JWKS_CACHE_SECONDS } from "../token/jwtConfig.js";
import { jwtKeys } from "../token/jwtKeys.js";

export const jwksRoutes = Router();

/**
 * GET /.well-known/jwks.json — publica la clave pública con la que se verifican los tokens (JWKS).
 * Es pública a propósito: solo permite verificar firmas, no crear tokens.
 *
 * @returns `{ keys: [jwk] }` con caché de cinco minutos.
 * @throws AppError 500 si el servidor no tiene configurada su clave privada.
 */
jwksRoutes.get(
  "/jwks.json",
  asyncHandler(async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", `public, max-age=${JWKS_CACHE_SECONDS}`);
    res.status(200).json({ keys: [jwtKeys.publicJwk()] });
  }),
);
