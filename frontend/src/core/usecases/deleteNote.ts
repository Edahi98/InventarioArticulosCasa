import type { NoteRepository } from "../domain/note.js";
import { httpNoteRepository } from "../../infrastructure/httpNoteRepository.js";

export class DeleteNoteUseCase {
  constructor(private readonly repository: NoteRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.remove(id);
  }
}

export const deleteNoteUseCase = new DeleteNoteUseCase(httpNoteRepository);
