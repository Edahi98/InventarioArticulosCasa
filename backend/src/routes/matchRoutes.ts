import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { matchService } from "../services/matchService.js";
import { matchBody, type MatchBody } from "../validators/matchValidators.js";

export const matchRoutes = Router();

/**
 * POST /match — busca en el inventario los artículos que coinciden con cada texto de `terms`
 * (por ejemplo, los ingredientes de una receta), tras normalizar mayúsculas, acentos, cantidades, unidades y plurales.
 *
 * @returns Una lista `{ term, matches }` con hasta 5 coincidencias por texto y su puntaje de 0.5 a 1.
 * @throws AppError 400 si `terms` está vacío, tiene más de 100 textos o algún texto supera los 200 caracteres.
 */
matchRoutes.post(
  "/",
  validateRequest({ body: matchBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { terms } = req.body as MatchBody;
    res.status(200).json(await matchService.match(terms));
  }),
);
