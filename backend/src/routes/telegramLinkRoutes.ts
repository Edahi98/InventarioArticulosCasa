import { eq } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import { db, users } from "../db/client.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { claimLimiter } from "../middleware/rateLimiters.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { linkCodeService } from "../services/linkCodeService.js";
import { sessionService } from "../services/sessionService.js";
import { BOT_TOKEN_TTL_SECONDS } from "../token/jwtConfig.js";
import TokenIssuer from "../token/tokenIsUser.js";
import { claimBody, type ClaimBody } from "../validators/telegramValidators.js";

const tokenIssuer = new TokenIssuer();

export const telegramLinkRoutes = Router();

/**
 * POST /auth/telegram/code — genera un código de un solo uso (vigente 5 minutos) para vincular Telegram.
 * Solo se obtiene con una sesión iniciada en la página web.
 *
 * @returns `{ code, expiresAt, botUsername }`; `botUsername` es `null` si no está configurado.
 * @throws AppError 401 si no hay una sesión válida.
 */
telegramLinkRoutes.post(
  "/code",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { code, expiresAt } = await linkCodeService.create(Number(req.auth?.sub));
    res.status(201).json({
      code,
      expiresAt: expiresAt.toISOString(),
      botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
    });
  }),
);

/**
 * POST /auth/telegram/claim — canjea un código de vinculación por un token del usuario que lo generó.
 * Lo usa el agente en nombre de Telegram; no recibe usuario ni contraseña.
 *
 * @returns `{ token, expiresAt, username }` con un token de 12 horas.
 * @throws AppError 400 si el formato no es válido, 401 si el código no existe, ya se usó o venció,
 * 429 tras 10 intentos fallidos en 15 minutos.
 */
telegramLinkRoutes.post(
  "/claim",
  claimLimiter,
  validateRequest({ body: claimBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body as ClaimBody;

    const userId = await linkCodeService.consume(code);
    const [user] = userId === null ? [] : await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new AppError("El código no es válido o ya venció.", 401);
    }

    const { token, expiresAt } = tokenIssuer.issue(user.id, user.username, BOT_TOKEN_TTL_SECONDS);
    await sessionService.create(user.id, token, expiresAt);
    res.status(200).json({ token, expiresAt: expiresAt.toISOString(), username: user.username });
  }),
);
