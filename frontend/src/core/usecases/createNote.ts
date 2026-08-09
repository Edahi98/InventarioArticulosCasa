import type { NewNoteInput, Note, NoteRepository } from "../domain/note.js";
import { httpNoteRepository } from "../../infrastructure/httpNoteRepository.js";

export class CreateNoteUseCase {
  constructor(private readonly repository: NoteRepository) {}

  async execute(input: NewNoteInput): Promise<Note> {
    return this.repository.create(input);
  }
}

export const createNoteUseCase = new CreateNoteUseCase(httpNoteRepository);
