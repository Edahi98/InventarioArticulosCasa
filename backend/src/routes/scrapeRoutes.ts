import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { scrapeLimiter } from "../middleware/rateLimiters.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { scrapeService } from "../services/scrapeService.js";
import { scrapeBody, type ScrapeBody } from "../validators/scrapeValidators.js";

export const scrapeRoutes = Router();

/**
 * POST /scrape — carga la página indicada en `url` con un navegador y devuelve su título, descripción,
 * encabezados, tablas, listas y enlaces.
 *
 * @throws AppError 400 si `url` no es una dirección http(s) pública.
 * @throws AppError 429 si se supera el límite de scrapings.
 * @throws AppError 502 si la página no carga, responde con error o tarda demasiado.
 */
scrapeRoutes.post(
  "/",
  scrapeLimiter,
  validateRequest({ body: scrapeBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body as ScrapeBody;
    res.status(200).json(await scrapeService.scrape(url));
  }),
);
