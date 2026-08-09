import type { CategoryRepository } from "../domain/category.js";
import { httpCategoryRepository } from "../../infrastructure/httpCategoryRepository.js";

export class DeleteCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.remove(id);
  }
}

export const deleteCategoryUseCase = new DeleteCategoryUseCase(httpCategoryRepository);
