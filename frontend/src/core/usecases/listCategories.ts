import type { Category, CategoryRepository } from "../domain/category.js";
import { httpCategoryRepository } from "../../infrastructure/httpCategoryRepository.js";

export class ListCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(): Promise<Category[]> {
    return this.repository.findAll();
  }
}

export const listCategoriesUseCase = new ListCategoriesUseCase(httpCategoryRepository);
