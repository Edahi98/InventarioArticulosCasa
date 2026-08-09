import type { Category, CategoryRepository, NewCategoryInput } from "../domain/category.js";
import { httpCategoryRepository } from "../../infrastructure/httpCategoryRepository.js";

export class CreateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(input: NewCategoryInput): Promise<Category> {
    return this.repository.create(input);
  }
}

export const createCategoryUseCase = new CreateCategoryUseCase(httpCategoryRepository);
