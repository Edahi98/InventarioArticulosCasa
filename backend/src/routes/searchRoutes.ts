import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { searchService } from "../services/searchService.js";
import { searchQuery, type SearchQuery } from "../validators/searchValidators.js";

export const searchRoutes = Router();

/**
 * GET /search?q= — busca artículos por nombre o descripción; sin `q` devuelve una lista vacía.
 *
 * @throws AppError 400 si `q` supera el largo permitido o contiene caracteres, scripts o SQL no permitidos.
 */
searchRoutes.get(
  "/",
  validateRequest({ query: searchQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query as unknown as SearchQuery;
    const results = await searchService.search(q);
    res.status(200).json(results);
  }),
);
