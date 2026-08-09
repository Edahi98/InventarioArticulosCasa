import type { Article, ArticleRepository, NewArticleInput } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class UpdateArticleUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(id: number, input: NewArticleInput): Promise<Article> {
    return this.repository.update(id, input);
  }
}

export const updateArticleUseCase = new UpdateArticleUseCase(httpArticleRepository);
