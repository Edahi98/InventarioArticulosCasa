export interface Note {
  id: number;
  title: string;
  description: string;
  articleId: number;
  createdAt: string;
}

export interface NewNoteInput {
  title: string;
  description: string;
  articleId: number;
}

export interface UpdateNoteInput {
  title: string;
  description: string;
}

export interface NoteRepository {
  findByArticleId(articleId: number): Promise<Note[]>;
  create(input: NewNoteInput): Promise<Note>;
  update(id: number, input: UpdateNoteInput): Promise<Note>;
  remove(id: number): Promise<void>;
}
