import { Router, type Request, type Response } from "express";
import multer from "multer";
import { cloudinaryService } from "../services/cloudinaryService.js";
import { validationService } from "../services/validationService.js";
import { articleValidationService } from "../services/articleValidationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { deleteArticle } from "../controllers/articleDeleteController.js";
import ArticleService from "../services/articleService.js";

const articleService = new ArticleService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export const articleRoutes = Router();

/**
 * POST /articles/upload — sube una imagen (campo `image`, máx. 4MB) a Cloudinary.
 *
 * @returns `{ id, url }` de la imagen subida.
 * @throws AppError 400 si no se envía imagen.
 */
articleRoutes.post(
  "/upload",
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No se recibió ninguna imagen.", 400);
    }
    const uploaded = await cloudinaryService.uploadFromBuffer(req.file.buffer);
    res.status(200).json(uploaded);
  }),
);

/**
 * GET /articles?categoryId= — lista artículos, opcionalmente de una categoría.
 */
articleRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const items = await articleService.list(categoryId);
    res.status(200).json(items);
  }),
);

/**
 * GET /articles/:id — devuelve un artículo.
 *
 * @throws AppError 404 si no existe.
 */
articleRoutes.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
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
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, imageUrl, categoryId, stock, needsRepair } = req.body ?? {};
    const validatedName = validationService.requireNonEmptyString(name, "name");
    const validatedCategoryId = validationService.requirePositiveInteger(categoryId, "categoryId");
    const validatedStock = articleValidationService.requireNonNegativeInteger(stock ?? 0, "stock");

    await validationService.ensureCategoryExists(validatedCategoryId);
    await validationService.ensureArticleNameIsUniqueInCategory(validatedName, validatedCategoryId);

    const created = await articleService.create({
      name: validatedName,
      description,
      imageUrl,
      categoryId: validatedCategoryId,
      stock: validatedStock,
      needsRepair: needsRepair === true,
    });
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
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, description, imageUrl, categoryId, stock, needsRepair } = req.body ?? {};
    const validatedName = validationService.requireNonEmptyString(name, "name");
    const validatedCategoryId = validationService.requirePositiveInteger(categoryId, "categoryId");
    const validatedStock = articleValidationService.requireNonNegativeInteger(stock ?? 0, "stock");

    await validationService.ensureCategoryExists(validatedCategoryId);

    const updated = await articleService.update(id, {
      name: validatedName,
      description,
      imageUrl,
      categoryId: validatedCategoryId,
      stock: validatedStock,
      needsRepair: needsRepair === true,
    });
    if (!updated) {
      throw new AppError(`El artículo con id ${id} no existe.`, 404);
    }
    res.status(200).json(updated);
  }),
);

articleRoutes.delete("/:id", deleteArticle);
