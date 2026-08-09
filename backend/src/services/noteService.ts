import { asc, eq } from "drizzle-orm";
import { db, notes } from "../db/client.js";
import { type Note } from "../db/schema.js";
import NoteBuilder from "../builders/noteBuilder.js";

export default class NoteService {
  async listByArticle(articleId: number): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.articleId, articleId))
      .orderBy(asc(notes.createdAt));
  }

  async getById(id: number): Promise<Note | undefined> {
    const [result] = await db.select().from(notes).where(eq(notes.id, id));
    return result;
  }

  async create(input: { title: string; description?: string; articleId: number }): Promise<Note> {
    const newNote = new NoteBuilder()
      .setTitle(input.title)
      .setDescription(input.description ?? "")
      .setArticleId(input.articleId)
      .build();

    const [created] = await db.insert(notes).values(newNote).returning();
    return created;
  }

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

  async remove(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
}