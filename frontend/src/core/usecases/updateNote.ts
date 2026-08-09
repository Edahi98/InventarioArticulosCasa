import type { Note, NoteRepository, UpdateNoteInput } from "../domain/note.js";
import { httpNoteRepository } from "../../infrastructure/httpNoteRepository.js";

export class UpdateNoteUseCase {
  constructor(private readonly repository: NoteRepository) {}

  async execute(id: number, input: UpdateNoteInput): Promise<Note> {
    return this.repository.update(id, input);
  }
}

export const updateNoteUseCase = new UpdateNoteUseCase(httpNoteRepository);
