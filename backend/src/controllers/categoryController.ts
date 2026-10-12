import type { Request, Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

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
 * @throws AppError 404 si no existe.
 */
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
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
 * @throws AppError 400 si falta el nombre, 409 si ya existe.
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, imageUrl } = req.body ?? {};
  const validatedName = validationService.requireNonEmptyString(name, "name");
  await validationService.ensureCategoryNameIsUnique(validatedName);

  const created = await categoryService.create({ name: validatedName, description, imageUrl });
  res.status(201).json(created);
});

/**
 * PUT /categories/:id — actualiza una categoría.
 *
 * @throws AppError 400 si falta el nombre, 404 si no existe, 409 si el nombre ya existe.
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, imageUrl } = req.body ?? {};
  const validatedName = validationService.requireNonEmptyString(name, "name");

  await validationService.ensureCategoryExists(id);
  await validationService.ensureCategoryNameIsUnique(validatedName, id);

  const updated = await categoryService.update(id, {
    name: validatedName,
    description,
    imageUrl,
  });
  if (!updated) {
    throw new AppError(`La categoría con id ${id} no existe.`, 404);
  }
  res.status(200).json(updated);
});

/**
 * DELETE /categories/:id — elimina una categoría sin artículos.
 *
 * Responde 204 al eliminar.
 * @throws AppError 404 si no existe, 409 si tiene artículos.
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  await validationService.ensureCategoryExists(id);
  await validationService.ensureCategoryHasNoArticles(id);

  await categoryService.remove(id);
  res.status(204).send();
});
