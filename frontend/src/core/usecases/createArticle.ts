import type { Article, ArticleRepository, NewArticleInput } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class CreateArticleUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(input: NewArticleInput): Promise<Article> {
    return this.repository.create(input);
  }
}

export const createArticleUseCase = new CreateArticleUseCase(httpArticleRepository);
