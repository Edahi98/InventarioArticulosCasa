import { Router, type Request, type Response } from "express";
import multer from "multer";
import { storage } from "../storage/client.js";
import { validationService } from "../services/validationService.js";
import { articleValidationService } from "../services/articleValidationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { deleteArticle } from "../controllers/articleDeleteController.js";
import ArticleService from "../services/articleService.js";

const articleService = new ArticleService();
// 4MB, por debajo del límite de payload de las funciones serverless de Vercel (~4.5MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export const articleRoutes = Router();

articleRoutes.post(
  "/upload",
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No se recibió ninguna imagen.", 400);
    }
    const uploaded = await storage.upload(req.file.buffer, req.file.originalname);
    res.status(200).json(uploaded);
  }),
);

articleRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const items = await articleService.list(categoryId);
    res.status(200).json(items);
  }),
);

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
