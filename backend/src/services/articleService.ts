import ArticleBuilder from "../builders/articleBuilder.js";
import { db, articles, categories } from "../db/client.js";
import { type Article } from "../db/schema.js";
import { count, eq, getTableColumns } from "drizzle-orm";
import { searchService } from "./searchService.js";

export type ArticleWithCategory = Article & { categoryName: string | null };

export type ArticleCount = {
  total: number;
  categories: { categoryId: number; categoryName: string; total: number }[];
};

export default class ArticleService {
  /**
   * Lista los artículos con el nombre de su categoría.
   *
   * @param categoryId - Si se indica, solo devuelve los artículos de esa categoría.
   * @returns Los artículos, cada uno con `categoryName`.
   */
  async list(categoryId?: number): Promise<ArticleWithCategory[]> {
    const query = db
      .select({ ...getTableColumns(articles), categoryName: categories.name })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id));

    if (categoryId) {
      return query.where(eq(articles.categoryId, categoryId));
    }
    return query;
  }

  /**
   * Cuenta los artículos por categoría; las categorías sin artículos aparecen con cero.
   *
   * @param categoryId - Si se indica, solo cuenta la de esa categoría.
   * @returns El total de artículos y el conteo de cada categoría (`categoryId`, `categoryName`, `total`).
   */
  async count(categoryId?: number): Promise<ArticleCount> {
    const rows = await db
      .select({ categoryId: categories.id, categoryName: categories.name, total: count(articles.id) })
      .from(categories)
      .leftJoin(articles, eq(articles.categoryId, categories.id))
      .where(categoryId ? eq(categories.id, categoryId) : undefined)
      .groupBy(categories.id, categories.name)
      .orderBy(categories.name);

    return { total: rows.reduce((sum, row) => sum + row.total, 0), categories: rows };
  }

  /**
   * Busca un artículo por id, con el nombre de su categoría.
   *
   * @param id - Identificador del artículo.
   * @returns El artículo, o `undefined` si no existe.
   */
  async getById(id: number): Promise<ArticleWithCategory | undefined> {
    const [result] = await db
      .select({ ...getTableColumns(articles), categoryName: categories.name })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.id, id));
    return result;
  }

  /**
   * Crea un artículo e invalida el índice de búsqueda.
   *
   * @param input - Datos del artículo; `description`, `needsRepair` y `location` son opcionales.
   * @returns El artículo creado.
   * @throws Error si el builder rechaza los datos (nombre, categoría, imagen o stock inválidos).
   */
  async create(input: {
    name: string;
    description?: string;
    imageUrl: string;
    categoryId: number;
    stock: number;
    needsRepair?: boolean;
    location?: string;
  }): Promise<Article> {
    const newArticle = new ArticleBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl)
      .setCategoryId(input.categoryId)
      .setStock(input.stock)
      .setNeedsRepair(input.needsRepair ?? false)
      .setLocation(input.location ?? "")
      .build();

    const [created] = await db.insert(articles).values(newArticle).returning();
    searchService.invalidate();
    return created;
  }

  /**
   * Reemplaza los datos de un artículo existente e invalida el índice de búsqueda.
   *
   * @param id - Identificador del artículo.
   * @param input - Nuevos datos del artículo.
   * @returns El artículo actualizado, o `undefined` si no existe.
   * @throws Error si el builder rechaza los datos.
   */
  async update(
    id: number,
    input: { name: string; description?: string; imageUrl: string; categoryId: number; stock: number; needsRepair?: boolean; location?: string },
  ): Promise<Article | undefined> {
    const updatedArticle = new ArticleBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl)
      .setCategoryId(input.categoryId)
      .setStock(input.stock)
      .setNeedsRepair(input.needsRepair ?? false)
      .setLocation(input.location ?? "")
      .build();

    const [updated] = await db
      .update(articles)
      .set(updatedArticle)
      .where(eq(articles.id, id))
      .returning();
    searchService.invalidate();
    return updated;
  }
}