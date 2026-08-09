import type { ArticleRepository } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class DeleteArticleUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.remove(id);
  }
}

export const deleteArticleUseCase = new DeleteArticleUseCase(httpArticleRepository);
