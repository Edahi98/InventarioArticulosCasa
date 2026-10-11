import { Router, type Request, type Response } from "express";
import { validationService } from "../services/validationService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import UserCredentialsVerifier from "../verefiers/userCredentialsVerifier.js";
import TokenIssuer from "../../src/token/tokenIsUser.js"

const userCredentialsVerifier = new UserCredentialsVerifier();
const tokenIssuer = new TokenIssuer();

export const authRoutes = Router();

/**
 * POST /auth/login — valida las credenciales y devuelve un token.
 *
 * @throws AppError 400 si faltan campos, 401 si son incorrectas.
 */
authRoutes.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    const validatedUsername = validationService.requireNonEmptyString(username, "username");
    const validatedPassword = validationService.requireNonEmptyString(password, "password");

    const user = await userCredentialsVerifier.verify(validatedUsername, validatedPassword);
    const token = tokenIssuer.issue(user.id, user.username);
    res.status(200).json({ token });
  }),
);
