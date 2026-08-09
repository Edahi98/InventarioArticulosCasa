import { notes, type Note, type NewNote } from "../db/schema.js";

export default class NoteBuilder {
  private title = "";
  private description = "";
  private articleId = 0;

  setTitle(title: string): this {
    this.title = title?.trim() ?? "";
    return this;
  }

  setDescription(description: string): this {
    this.description = description?.trim() ?? "";
    return this;
  }

  setArticleId(articleId: number): this {
    this.articleId = articleId;
    return this;
  }

  build(): NewNote {
    if (!this.title) {
      throw new Error("El título de la nota es obligatorio.");
    }
    if (!this.articleId || Number.isNaN(this.articleId)) {
      throw new Error("La nota debe estar asociada a un artículo válido.");
    }
    return {
      title: this.title,
      description: this.description,
      articleId: this.articleId,
    };
  }
}