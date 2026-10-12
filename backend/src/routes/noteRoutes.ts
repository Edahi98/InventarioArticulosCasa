import { Router, type Request, type Response } from "express";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import NoteService from "../services/noteService.js";


const noteService = new NoteService();

export const noteRoutes = Router();

/**
 * GET /notes?articleId= — lista las notas de un artículo; sin `articleId` lista todas.
 *
 * @throws AppError 400 si `articleId` no es un identificador válido.
 */
noteRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (req.query.articleId === undefined) {
      const items = await noteService.listAll();
      res.status(200).json(items);
      return;
    }
    const articleId = validationService.requirePositiveInteger(req.query.articleId, "articleId");
    const items = await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);

/**
 * GET /notes/:id — devuelve una nota.
 *
 * @throws AppError 404 si no existe.
 */
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

/**
 * POST /notes — crea una nota en un artículo existente.
 *
 * Responde 201 con la nota creada.
 * @throws AppError 400 si faltan campos, 404 si el artículo no existe.
 */
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

/**
 * PUT /notes/:id — actualiza título y descripción.
 *
 * @throws AppError 400 si falta el título, 404 si no existe.
 */
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

/**
 * DELETE /notes/:id — elimina una nota.
 *
 * Responde 204.
 */
noteRoutes.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await noteService.remove(id);
    res.status(204).send();
  }),
);

export const articleNoteRoutes = Router();

/**
 * GET /articles/:articleId/notes — lista las notas de un artículo existente.
 *
 * @throws AppError 404 si el artículo no existe.
 */
articleNoteRoutes.get(
  "/:articleId/notes",
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = Number(req.params.articleId);
    await validationService.ensureArticleExists(articleId);
    const items = await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);
