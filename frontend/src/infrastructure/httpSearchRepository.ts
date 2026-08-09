import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

export interface SearchResult {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  stock: number;
  needsRepair: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export async function searchArticles(query: string): Promise<SearchResult[]> {
  return authenticatedHttpClient.request<SearchResult[]>(
    `/search?q=${encodeURIComponent(query)}`,
  );
}
