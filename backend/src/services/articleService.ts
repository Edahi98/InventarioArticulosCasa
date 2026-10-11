import ArticleBuilder from "../builders/articleBuilder.js";
import { db, articles, categories } from "../db/client.js";
import { type Article } from "../db/schema.js";
import { eq, getTableColumns } from "drizzle-orm";
import { searchService } from "./searchService.js";

export type ArticleWithCategory = Article & { categoryName: string | null };

export default class ArticleService {
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

  async getById(id: number): Promise<ArticleWithCategory | undefined> {
    const [result] = await db
      .select({ ...getTableColumns(articles), categoryName: categories.name })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.id, id));
    return result;
  }

  async create(input: {
    name: string;
    description?: string;
    imageUrl: string;
    categoryId: number;
    stock: number;
    needsRepair?: boolean;
  }): Promise<Article> {
    const newArticle = new ArticleBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl)
      .setCategoryId(input.categoryId)
      .setStock(input.stock)
      .setNeedsRepair(input.needsRepair ?? false)
      .build();

    const [created] = await db.insert(articles).values(newArticle).returning();
    searchService.invalidate();
    return created;
  }

  async update(
    id: number,
    input: { name: string; description?: string; imageUrl: string; categoryId: number; stock: number; needsRepair?: boolean },
  ): Promise<Article | undefined> {
    const updatedArticle = new ArticleBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl)
      .setCategoryId(input.categoryId)
      .setStock(input.stock)
      .setNeedsRepair(input.needsRepair ?? false)
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