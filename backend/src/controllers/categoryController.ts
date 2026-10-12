import type { Request, Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import type { CategoryBody } from "../validators/categoryValidators.js";

type IdParams = { id: number };

/**
 * GET /categories — lista las categorías.
 */
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const items = await categoryService.list();
  res.status(200).json(items);
});

/**
 * GET /categories/:id — devuelve una categoría.
 *
 * @throws AppError 400 si el id no es válido, 404 si no existe.
 */
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const item = await categoryService.getById(id);
  if (!item) {
    throw new AppError(`La categoría con id ${id} no existe.`, 404);
  }
  res.status(200).json(item);
});

/**
 * POST /categories — crea una categoría con nombre único.
 *
 * Responde 201 con la categoría creada.
 * @throws AppError 400 si los datos no son válidos, 409 si ya existe.
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CategoryBody;
  await validationService.ensureCategoryNameIsUnique(body.name);

  const created = await categoryService.create(body);
  res.status(201).json(created);
});

/**
 * PUT /categories/:id — actualiza una categoría.
 *
 * @throws AppError 400 si los datos no son válidos, 404 si no existe, 409 si el nombre ya existe.
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const body = req.body as CategoryBody;

  await validationService.ensureCategoryExists(id);
  await validationService.ensureCategoryNameIsUnique(body.name, id);

  const updated = await categoryService.update(id, body);
  if (!updated) {
    throw new AppError(`La categoría con id ${id} no existe.`, 404);
  }
  res.status(200).json(updated);
});

/**
 * DELETE /categories/:id — elimina una categoría sin artículos.
 *
 * Responde 204 al eliminar.
 * @throws AppError 400 si el id no es válido, 404 si no existe, 409 si tiene artículos.
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;

  await validationService.ensureCategoryExists(id);
  await validationService.ensureCategoryHasNoArticles(id);

  await categoryService.remove(id);
  res.status(204).send();
});
