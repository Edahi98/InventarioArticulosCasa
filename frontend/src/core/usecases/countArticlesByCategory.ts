import type { ArticleCountReport, ArticleRepository } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class CountArticlesByCategoryUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(): Promise<ArticleCountReport> {
    return this.repository.countByCategory();
  }
}

export const countArticlesByCategoryUseCase = new CountArticlesByCategoryUseCase(httpArticleRepository);
