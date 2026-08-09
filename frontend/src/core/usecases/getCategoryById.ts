import type { Category, CategoryRepository } from "../domain/category.js";
import { httpCategoryRepository } from "../../infrastructure/httpCategoryRepository.js";

export class GetCategoryByIdUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: number): Promise<Category> {
    return this.repository.findById(id);
  }
}

export const getCategoryByIdUseCase = new GetCategoryByIdUseCase(httpCategoryRepository);
