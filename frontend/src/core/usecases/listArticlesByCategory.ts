import type { Article, ArticleRepository } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class ListArticlesByCategoryUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(categoryId: number): Promise<Article[]> {
    return this.repository.findByCategoryId(categoryId);
  }
}

export const listArticlesByCategoryUseCase = new ListArticlesByCategoryUseCase(
  httpArticleRepository,
);
