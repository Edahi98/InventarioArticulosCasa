import { asc, eq } from "drizzle-orm";
import { db, notes } from "../db/client.js";
import { type Note } from "../db/schema.js";
import NoteBuilder from "../builders/noteBuilder.js";

export default class NoteService {
  /**
   * Lista todas las notas, de la más antigua a la más reciente.
   *
   * @returns Las notas.
   */
  async listAll(): Promise<Note[]> {
    return db.select().from(notes).orderBy(asc(notes.createdAt));
  }

  /**
   * Lista las notas de un artículo, de la más antigua a la más reciente.
   *
   * @param articleId - Identificador del artículo.
   * @returns Las notas del artículo.
   */
  async listByArticle(articleId: number): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.articleId, articleId))
      .orderBy(asc(notes.createdAt));
  }

  /**
   * Busca una nota por id.
   *
   * @param id - Identificador de la nota.
   * @returns La nota, o `undefined` si no existe.
   */
  async getById(id: number): Promise<Note | undefined> {
    const [result] = await db.select().from(notes).where(eq(notes.id, id));
    return result;
  }

  /**
   * Crea una nota asociada a un artículo.
   *
   * @param input - Título (obligatorio), descripción opcional e id del artículo.
   * @returns La nota creada.
   * @throws Error si el título está vacío o el artículo no es válido.
   */
  async create(input: { title: string; description?: string; articleId: number }): Promise<Note> {
    const newNote = new NoteBuilder()
      .setTitle(input.title)
      .setDescription(input.description ?? "")
      .setArticleId(input.articleId)
      .build();

    const [created] = await db.insert(notes).values(newNote).returning();
    return created;
  }

  /**
   * Actualiza el título y la descripción de una nota.
   *
   * @param id - Identificador de la nota.
   * @param input - Nuevo título y descripción.
   * @returns La nota actualizada, o `undefined` si no existe.
   * @throws Error si el título está vacío.
   */
  async update(id: number, input: { title: string; description?: string }): Promise<Note | undefined> {
    const title = input.title?.trim() ?? "";
    const description = input.description?.trim() ?? "";
    if (!title) {
      throw new Error("El título de la nota es obligatorio.");
    }

    const [updated] = await db
      .update(notes)
      .set({ title, description })
      .where(eq(notes.id, id))
      .returning();
    return updated;
  }

  /**
   * Elimina una nota.
   *
   * @param id - Identificador de la nota.
   */
  async remove(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
}