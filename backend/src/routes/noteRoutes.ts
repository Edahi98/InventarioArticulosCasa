import { Router, type Request, type Response } from "express";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { validateRequest } from "../middleware/validateRequest.js";
import NoteService from "../services/noteService.js";
import { articleNotesParams } from "../validators/articleValidators.js";
import {
  noteCreateBody,
  noteIdParams,
  noteListQuery,
  noteUpdateBody,
  type NoteCreateBody,
  type NoteUpdateBody,
} from "../validators/noteValidators.js";

const noteService = new NoteService();

type IdParams = { id: number };

export const noteRoutes = Router();

/**
 * GET /notes?articleId= — lista las notas de un artículo; sin `articleId` lista todas.
 *
 * @throws AppError 400 si `articleId` no es un identificador válido.
 */
noteRoutes.get(
  "/",
  validateRequest({ query: noteListQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const { articleId } = req.query as unknown as { articleId?: number };
    const items = articleId === undefined ? await noteService.listAll() : await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);

/**
 * GET /notes/:id — devuelve una nota.
 *
 * @throws AppError 400 si el id no es válido, 404 si no existe.
 */
noteRoutes.get(
  "/:id",
  validateRequest({ params: noteIdParams }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParams;
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
 * @throws AppError 400 si faltan campos o no son válidos, 404 si el artículo no existe.
 */
noteRoutes.post(
  "/",
  validateRequest({ body: noteCreateBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as NoteCreateBody;

    await validationService.ensureArticleExists(body.articleId);

    const created = await noteService.create(body);
    res.status(201).json(created);
  }),
);

/**
 * PUT /notes/:id — actualiza título y descripción.
 *
 * @throws AppError 400 si los datos no son válidos, 404 si no existe.
 */
noteRoutes.put(
  "/:id",
  validateRequest({ params: noteIdParams, body: noteUpdateBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParams;
    const body = req.body as NoteUpdateBody;

    const updated = await noteService.update(id, body);
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
 * @throws AppError 400 si el id no es válido.
 */
noteRoutes.delete(
  "/:id",
  validateRequest({ params: noteIdParams }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParams;
    await noteService.remove(id);
    res.status(204).send();
  }),
);

export const articleNoteRoutes = Router();

/**
 * GET /articles/:articleId/notes — lista las notas de un artículo existente.
 *
 * @throws AppError 400 si el id no es válido, 404 si el artículo no existe.
 */
articleNoteRoutes.get(
  "/:articleId/notes",
  validateRequest({ params: articleNotesParams }),
  asyncHandler(async (req: Request, res: Response) => {
    const { articleId } = req.params as unknown as { articleId: number };
    await validationService.ensureArticleExists(articleId);
    const items = await noteService.listByArticle(articleId);
    res.status(200).json(items);
  }),
);
