import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, articles } from "../db/client.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { searchService } from "../services/searchService.js";

class ArticleDeleteService {
  /**
   * Elimina un artículo si existe e invalida el índice de búsqueda.
   *
   * @param id - Identificador del artículo.
   * @returns `true` si se eliminó, `false` si no existía.
   */
  async remove(id: number): Promise<boolean> {
    const [existing] = await db.select().from(articles).where(eq(articles.id, id));
    if (!existing) {
      return false;
    }
    await db.delete(articles).where(eq(articles.id, id));
    searchService.invalidate();
    return true;
  }
}

const articleDeleteService = new ArticleDeleteService();

/**
 * DELETE /articles/:id — elimina un artículo.
 *
 * Responde 204 al eliminar.
 * @throws AppError 400 si el id no es válido, 404 si el artículo no existe.
 */
export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("El id del artículo debe ser un número válido.", 400);
  }

  const deleted = await articleDeleteService.remove(id);
  if (!deleted) {
    throw new AppError(`El artículo con id ${id} no existe.`, 404);
  }

  res.status(204).send();
});
