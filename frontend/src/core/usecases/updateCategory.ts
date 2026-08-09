import type { Category, CategoryRepository, NewCategoryInput } from "../domain/category.js";
import { httpCategoryRepository } from "../../infrastructure/httpCategoryRepository.js";

export class UpdateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: number, input: NewCategoryInput): Promise<Category> {
    return this.repository.update(id, input);
  }
}

export const updateCategoryUseCase = new UpdateCategoryUseCase(httpCategoryRepository);
