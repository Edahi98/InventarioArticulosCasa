import type { Note, NoteRepository } from "../domain/note.js";
import { httpNoteRepository } from "../../infrastructure/httpNoteRepository.js";

export class ListNotesByArticleUseCase {
  constructor(private readonly repository: NoteRepository) {}

  async execute(articleId: number): Promise<Note[]> {
    return this.repository.findByArticleId(articleId);
  }
}

export const listNotesByArticleUseCase = new ListNotesByArticleUseCase(httpNoteRepository);
