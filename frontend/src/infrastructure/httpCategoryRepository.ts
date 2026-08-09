import type {
  Category,
  CategoryRepository,
  NewCategoryInput,
} from "../core/domain/category.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const API_BASE_URL = "/categories";

export class HttpCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    return authenticatedHttpClient.request<Category[]>(API_BASE_URL);
  }

  async create(input: NewCategoryInput): Promise<Category> {
    return authenticatedHttpClient.request<Category>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async findById(id: number): Promise<Category> {
    return authenticatedHttpClient.request<Category>(`${API_BASE_URL}/${id}`);
  }

  async update(id: number, input: NewCategoryInput): Promise<Category> {
    return authenticatedHttpClient.request<Category>(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async remove(id: number): Promise<void> {
    await authenticatedHttpClient.request<void>(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
  }
}

export const httpCategoryRepository = new HttpCategoryRepository();
