import type {
  NewNoteInput,
  Note,
  NoteRepository,
  UpdateNoteInput,
} from "../core/domain/note.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const API_BASE_URL = "/notes";

export class HttpNoteRepository implements NoteRepository {
  async findByArticleId(articleId: number): Promise<Note[]> {
    return authenticatedHttpClient.request<Note[]>(`/articles/${articleId}/notes`);
  }

  async create(input: NewNoteInput): Promise<Note> {
    return authenticatedHttpClient.request<Note>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async update(id: number, input: UpdateNoteInput): Promise<Note> {
    return authenticatedHttpClient.request<Note>(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async remove(id: number): Promise<void> {
    await authenticatedHttpClient.request<void>(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
  }
}

export const httpNoteRepository = new HttpNoteRepository();
