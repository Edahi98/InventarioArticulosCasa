import { Router, type Request, type Response } from "express";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import NoteService from "../services/noteService.js";


const noteService = new NoteService();

export const noteRoutes = Router();

noteRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = validationService.requirePositiveInteger(req.query.articleId, "articleId");
    const items = await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);

noteRoutes.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = await noteService.getById(id);
    if (!item) {
      throw new AppError(`La nota con id ${id} no existe.`, 404);
    }
    res.status(200).json(item);
  }),
);

noteRoutes.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, articleId } = req.body ?? {};
    const validatedTitle = validationService.requireNonEmptyString(title, "title");
    const validatedArticleId = validationService.requirePositiveInteger(articleId, "articleId");

    await validationService.ensureArticleExists(validatedArticleId);

    const created = await noteService.create({
      title: validatedTitle,
      description,
      articleId: validatedArticleId,
    });
    res.status(201).json(created);
  }),
);

noteRoutes.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { title, description } = req.body ?? {};
    const validatedTitle = validationService.requireNonEmptyString(title, "title");

    const updated = await noteService.update(id, { title: validatedTitle, description });
    if (!updated) {
      throw new AppError(`La nota con id ${id} no existe.`, 404);
    }
    res.status(200).json(updated);
  }),
);

noteRoutes.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await noteService.remove(id);
    res.status(204).send();
  }),
);

export const articleNoteRoutes = Router();

articleNoteRoutes.get(
  "/:articleId/notes",
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = Number(req.params.articleId);
    await validationService.ensureArticleExists(articleId);
    const items = await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);
