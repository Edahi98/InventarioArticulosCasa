import type {
  Article,
  ArticleRepository,
  NewArticleInput,
  UploadedImage,
} from "../core/domain/article.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const API_BASE_URL = "/articles";

export class HttpArticleRepository implements ArticleRepository {
  async create(input: NewArticleInput): Promise<Article> {
    return authenticatedHttpClient.request<Article>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async uploadImage(file: File): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append("image", file);

    return authenticatedHttpClient.request<UploadedImage>(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
  }

  async findById(id: number): Promise<Article> {
    return authenticatedHttpClient.request<Article>(`${API_BASE_URL}/${id}`);
  }

  async findByCategoryId(categoryId: number): Promise<Article[]> {
    return authenticatedHttpClient.request<Article[]>(`${API_BASE_URL}?categoryId=${categoryId}`);
  }

  async update(id: number, input: NewArticleInput): Promise<Article> {
    return authenticatedHttpClient.request<Article>(`${API_BASE_URL}/${id}`, {
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

export const httpArticleRepository = new HttpArticleRepository();
