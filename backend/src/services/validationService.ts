import { eq } from "drizzle-orm";
import { db, articles, categories } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export class ValidationService {
  /**
   * Verifica que exista una categoría.
   *
   * @param categoryId - Identificador de la categoría.
   * @throws AppError 404 si no existe.
   */
  async ensureCategoryExists(categoryId: number): Promise<void> {
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (!category) {
      throw new AppError(`La categoría con id ${categoryId} no existe.`, 404);
    }
  }

  /**
   * Verifica que exista un artículo.
   *
   * @param articleId - Identificador del artículo.
   * @throws AppError 404 si no existe.
   */
  async ensureArticleExists(articleId: number): Promise<void> {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    if (!article) {
      throw new AppError(`El artículo con id ${articleId} no existe.`, 404);
    }
  }

  /**
   * Verifica que ninguna otra categoría tenga el mismo nombre.
   *
   * @param name - Nombre a comprobar.
   * @param excludeId - Categoría que se ignora (la que se está editando).
   * @throws AppError 409 si el nombre ya existe.
   */
  async ensureCategoryNameIsUnique(name: string, excludeId?: number): Promise<void> {
    const [existing] = await db.select().from(categories).where(eq(categories.name, name));
    if (existing && existing.id !== excludeId) {
      throw new AppError(`La categoría "${name}" ya existe.`, 409);
    }
  }

  /**
   * Verifica que la categoría no tenga ya un artículo con ese nombre (sin distinguir mayúsculas).
   *
   * @param name - Nombre del artículo.
   * @param categoryId - Categoría donde se comprueba.
   * @throws AppError 409 si ya existe.
   */
  async ensureArticleNameIsUniqueInCategory(name: string, categoryId: number): Promise<void> {
    const matches = await db.select().from(articles).where(eq(articles.categoryId, categoryId));
    const duplicate = matches.some((article) => article.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      throw new AppError(`El artículo "${name}" ya existe en esta categoría.`, 409);
    }
  }

  /**
   * Verifica que una categoría no tenga artículos asociados antes de borrarla.
   *
   * @param categoryId - Identificador de la categoría.
   * @throws AppError 409 si tiene artículos.
   */
  async ensureCategoryHasNoArticles(categoryId: number): Promise<void> {
    const linkedArticles = await db.select().from(articles).where(eq(articles.categoryId, categoryId));
    if (linkedArticles.length > 0) {
      throw new AppError(
        `No se puede eliminar la categoría porque tiene ${linkedArticles.length} artículo(s) asociado(s). Elimina o reasigna esos artículos primero.`,
        409,
      );
    }
  }
}

export const validationService = new ValidationService();
