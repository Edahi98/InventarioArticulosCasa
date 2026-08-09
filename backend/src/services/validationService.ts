import { eq } from "drizzle-orm";
import { db, articles, categories } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export class ValidationService {
  requireNonEmptyString(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new AppError(`El campo "${fieldName}" es obligatorio.`, 400);
    }
    return value.trim();
  }

  requirePositiveInteger(value: unknown, fieldName: string): number {
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue <= 0) {
      throw new AppError(`El campo "${fieldName}" debe ser un identificador válido.`, 400);
    }
    return numericValue;
  }

  async ensureCategoryExists(categoryId: number): Promise<void> {
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (!category) {
      throw new AppError(`La categoría con id ${categoryId} no existe.`, 404);
    }
  }

  async ensureArticleExists(articleId: number): Promise<void> {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    if (!article) {
      throw new AppError(`El artículo con id ${articleId} no existe.`, 404);
    }
  }

  async ensureCategoryNameIsUnique(name: string, excludeId?: number): Promise<void> {
    const [existing] = await db.select().from(categories).where(eq(categories.name, name));
    if (existing && existing.id !== excludeId) {
      throw new AppError(`La categoría "${name}" ya existe.`, 409);
    }
  }

  async ensureArticleNameIsUniqueInCategory(name: string, categoryId: number): Promise<void> {
    const matches = await db.select().from(articles).where(eq(articles.categoryId, categoryId));
    const duplicate = matches.some((article) => article.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      throw new AppError(`El artículo "${name}" ya existe en esta categoría.`, 409);
    }
  }

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
