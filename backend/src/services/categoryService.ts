import { eq } from "drizzle-orm";
import { db, categories } from "../db/client.js";
import { type Category, type NewCategory } from "../db/schema.js";
import CategoryBuilder from "../builders/categoryBuilder.js";
import { searchService } from "./searchService.js";

export class CategoryService {
  /**
   * Lista todas las categorías.
   *
   * @returns Las categorías.
   */
  async list(): Promise<Category[]> {
    return db.select().from(categories);
  }

  /**
   * Busca una categoría por id.
   *
   * @param id - Identificador de la categoría.
   * @returns La categoría, o `undefined` si no existe.
   */
  async getById(id: number): Promise<Category | undefined> {
    const [result] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return result;
  }

  /**
   * Crea una categoría e invalida el índice de búsqueda.
   *
   * @param input - Nombre (obligatorio), descripción, imagen y ubicación opcionales.
   * @returns La categoría creada.
   * @throws Error si el nombre está vacío.
   */
  async create(input: {
    name: string;
    description?: string;
    imageUrl?: string;
    location?: string;
  }): Promise<Category> {
    const newCategory = new CategoryBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl ?? "")
      .setLocation(input.location ?? "")
      .build();

    const [created] = await db
      .insert(categories)
      .values(newCategory)
      .returning();
    searchService.invalidate();
    return created;
  }

  /**
   * Reemplaza los datos de una categoría e invalida el índice de búsqueda.
   *
   * @param id - Identificador de la categoría.
   * @param input - Nuevos datos de la categoría.
   * @returns La categoría actualizada, o `undefined` si no existe.
   * @throws Error si el nombre está vacío.
   */
  async update(
    id: number,
    input: { name: string; description?: string; imageUrl?: string; location?: string },
  ): Promise<Category | undefined> {
    const updatedCategory = new CategoryBuilder()
      .setName(input.name)
      .setDescription(input.description ?? "")
      .setImageUrl(input.imageUrl ?? "")
      .setLocation(input.location ?? "")
      .build();

    const [updated] = await db
      .update(categories)
      .set(updatedCategory)
      .where(eq(categories.id, id))
      .returning();
    searchService.invalidate();
    return updated;
  }

  /**
   * Elimina una categoría e invalida el índice de búsqueda.
   *
   * @param id - Identificador de la categoría.
   */
  async remove(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
    searchService.invalidate();
  }
}

export const categoryService = new CategoryService();
