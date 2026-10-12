import { Router, type Request, type Response } from "express";
import { sessionService } from "../services/sessionService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import UserCredentialsVerifier from "../verefiers/userCredentialsVerifier.js";
import TokenIssuer from "../token/tokenIsUser.js";
import { loginBody, type LoginBody } from "../validators/userValidators.js";

const userCredentialsVerifier = new UserCredentialsVerifier();
const tokenIssuer = new TokenIssuer();

export const authRoutes = Router();

/**
 * POST /auth/login — valida las credenciales, registra la sesión en la base de datos y devuelve un token.
 *
 * @throws AppError 400 si faltan campos o no son válidos, 401 si son incorrectas.
 */
authRoutes.post(
  "/login",
  validateRequest({ body: loginBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as LoginBody;

    const user = await userCredentialsVerifier.verify(username, password);
    const { token, expiresAt } = tokenIssuer.issue(user.id, user.username);
    await sessionService.create(user.id, token, expiresAt);
    res.status(200).json({ token });
  }),
);

/**
 * POST /auth/logout — cierra la sesión del token recibido; el token deja de ser válido de inmediato.
 *
 * Responde 204.
 * @throws AppError 401 si el token falta, es inválido o su sesión ya no existe.
 */
authRoutes.post(
  "/logout",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await sessionService.revoke(req.token ?? "");
    res.status(204).send();
  }),
);
