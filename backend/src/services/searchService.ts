import MiniSearch from "minisearch";
import { eq } from "drizzle-orm";
import { db, articles, categories } from "../db/client.js";

interface SearchDocument {
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

class SearchService {
  private index: MiniSearch<SearchDocument> | null = null;
  private lastIndexed = 0;
  private readonly TTL_MS = 30_000;

  private buildIndex(docs: SearchDocument[]): MiniSearch<SearchDocument> {
    const ms = new MiniSearch<SearchDocument>({
      fields: ["name", "description"],
      storeFields: ["id", "name", "description", "imageUrl", "stock", "needsRepair", "categoryId", "categoryName", "createdAt"],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });
    ms.addAll(docs);
    return ms;
  }

  private async getIndex(): Promise<MiniSearch<SearchDocument>> {
    const now = Date.now();
    if (this.index && now - this.lastIndexed < this.TTL_MS) {
      return this.index;
    }

    const rows = await db
      .select({
        id: articles.id,
        name: articles.name,
        description: articles.description,
        imageUrl: articles.imageUrl,
        stock: articles.stock,
        needsRepair: articles.needsRepair,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id));

    const docs: SearchDocument[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      stock: r.stock,
      needsRepair: r.needsRepair,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      createdAt: r.createdAt,
    }));

    this.index = this.buildIndex(docs);
    this.lastIndexed = now;
    return this.index;
  }

  async search(query: string): Promise<SearchDocument[]> {
    if (!query.trim()) return [];
    const ms = await this.getIndex();
    const results = ms.search(query);
    return results as unknown as SearchDocument[];
  }

  invalidate(): void {
    this.index = null;
    this.lastIndexed = 0;
  }
}

export const searchService = new SearchService();
