import { eq } from "drizzle-orm";
import { db, categories } from "../db/client.js";
import { type Category, type NewCategory } from "../db/schema.js";
import CategoryBuilder from "../builders/categoryBuilder.js";

export class CategoryService {
  async list(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getById(id: number): Promise<Category | undefined> {
    const [result] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return result;
  }

  async create(input: {
    name: string;
    description?: string;
    imageUrl?: string;
  }): Promise<Category> {
    const newCategory = new CategoryBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl ?? "")
      .build();

    const [created] = await db
      .insert(categories)
      .values(newCategory)
      .returning();
    return created;
  }

  async update(
    id: number,
    input: { name: string; description?: string; imageUrl?: string },
  ): Promise<Category | undefined> {
    const updatedCategory = new CategoryBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl ?? "")
      .build();

    const [updated] = await db
      .update(categories)
      .set(updatedCategory)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async remove(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}

export const categoryService = new CategoryService();
