import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { searchService } from "../services/searchService.js";

export const searchRoutes = Router();

searchRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await searchService.search(q);
    res.status(200).json(results);
  }),
);
