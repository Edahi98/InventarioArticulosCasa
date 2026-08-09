import ArticleBuilder from "../builders/articleBuilder.js";
import { db, articles } from "../db/client.js";
import { type Article } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { searchService } from "./searchService.js";

export default class ArticleService {
  async list(categoryId?: number): Promise<Article[]> {
    if (categoryId) {
      return db.select().from(articles).where(eq(articles.categoryId, categoryId));
    }
    return db.select().from(articles);
  }

  async getById(id: number): Promise<Article | undefined> {
    const [result] = await db.select().from(articles).where(eq(articles.id, id));
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