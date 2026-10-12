import { Router, type Request, type Response } from "express";
import multer from "multer";
import { cloudinaryService } from "../services/cloudinaryService.js";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { deleteArticle } from "../controllers/articleDeleteController.js";
import ArticleService from "../services/articleService.js";
import {
  articleBody,
  articleIdParams,
  articleListQuery,
  imageFile,
  type ArticleBody,
} from "../validators/articleValidators.js";
import { LIMITS } from "../validators/injectionPatterns.js";

const articleService = new ArticleService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.imageBytes } });

type IdParams = { id: number };

export const articleRoutes = Router();

/**
 * POST /articles/upload — sube una imagen (campo `image`, máx. 4MB) a Cloudinary.
 *
 * @returns `{ id, url }` de la imagen subida.
 * @throws AppError 400 si no se envía imagen o no es JPEG, PNG, WEBP o GIF, 429 si se suben demasiadas.
 */
articleRoutes.post(
  "/upload",
  uploadLimiter,
  upload.single("image"),
  validateRequest({ file: imageFile }),
  asyncHandler(async (req: Request, res: Response) => {
    const uploaded = await cloudinaryService.uploadFromBuffer(req.file!.buffer);
    res.status(200).json(uploaded);
  }),
);

/**
 * GET /articles?categoryId= — lista artículos, opcionalmente de una categoría.
 *
 * @throws AppError 400 si `categoryId` no es un identificador válido.
 */
articleRoutes.get(
  "/",
  validateRequest({ query: articleListQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.query as unknown as { categoryId?: number };
    const items = await articleService.list(categoryId);
    res.status(200).json(items);
  }),
);

/**
 * GET /articles/:id — devuelve un artículo.
 *
 * @throws AppError 400 si el id no es válido, 404 si no existe.
 */
articleRoutes.get(
  "/:id",
  validateRequest({ params: articleIdParams }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParams;
    const item = await articleService.getById(id);
    if (!item) {
      throw new AppError(`El artículo con id ${id} no existe.`, 404);
    }
    res.status(200).json(item);
  }),
);

/**
 * POST /articles — crea un artículo.
 *
 * Responde 201 con el artículo creado.
 * @throws AppError 400 si los datos no son válidos, 404 si la categoría no existe, 409 si el nombre ya existe en la categoría.
 */
articleRoutes.post(
  "/",
  validateRequest({ body: articleBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ArticleBody;

    await validationService.ensureCategoryExists(body.categoryId);
    await validationService.ensureArticleNameIsUniqueInCategory(body.name, body.categoryId);

    const created = await articleService.create(body);
    res.status(201).json(created);
  }),
);

/**
 * PUT /articles/:id — reemplaza los datos de un artículo.
 *
 * @throws AppError 400 si los datos no son válidos, 404 si el artículo o la categoría no existen.
 */
articleRoutes.put(
  "/:id",
  validateRequest({ params: articleIdParams, body: articleBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParams;
    const body = req.body as ArticleBody;

    await validationService.ensureCategoryExists(body.categoryId);

    const updated = await articleService.update(id, body);
    if (!updated) {
      throw new AppError(`El artículo con id ${id} no existe.`, 404);
    }
    res.status(200).json(updated);
  }),
);

articleRoutes.delete("/:id", validateRequest({ params: articleIdParams }), deleteArticle);
