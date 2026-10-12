import { notes, type Note, type NewNote } from "../db/schema.js";

export default class NoteBuilder {
  private title = "";
  private description = "";
  private articleId = 0;

  /**
   * @param title - Título de la nota; se recortan los espacios.
   * @returns El mismo builder.
   */
  setTitle(title: string): this {
    this.title = title?.trim() ?? "";
    return this;
  }

  /**
   * @param description - Descripción; se recortan los espacios.
   * @returns El mismo builder.
   */
  setDescription(description: string): this {
    this.description = description?.trim() ?? "";
    return this;
  }

  /**
   * @param articleId - Identificador del artículo al que pertenece.
   * @returns El mismo builder.
   */
  setArticleId(articleId: number): this {
    this.articleId = articleId;
    return this;
  }

  /**
   * Valida los datos y construye la nota.
   *
   * @returns La nota lista para insertar.
   * @throws Error si falta el título o el artículo no es válido.
   */
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