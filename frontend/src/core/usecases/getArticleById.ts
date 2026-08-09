import type { Article, ArticleRepository } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class GetArticleByIdUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(id: number): Promise<Article> {
    return this.repository.findById(id);
  }
}

export const getArticleByIdUseCase = new GetArticleByIdUseCase(httpArticleRepository);
