import type { ArticleRepository, UploadedImage } from "../domain/article.js";
import { httpArticleRepository } from "../../infrastructure/httpArticleRepository.js";

export class UploadArticleImageUseCase {
  constructor(private readonly repository: ArticleRepository) {}

  async execute(file: File): Promise<UploadedImage> {
    return this.repository.uploadImage(file);
  }
}

export const uploadArticleImageUseCase = new UploadArticleImageUseCase(httpArticleRepository);
