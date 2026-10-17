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
  location: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

class SearchService {
  private index: MiniSearch<SearchDocument> | null = null;
  private lastIndexed = 0;
  private readonly TTL_MS = 30_000;

  /**
   * Crea un índice MiniSearch con los documentos dados.
   *
   * @param docs - Artículos con el nombre de su categoría.
   * @returns El índice listo para buscar (prefijo y coincidencia aproximada).
   */
  private buildIndex(docs: SearchDocument[]): MiniSearch<SearchDocument> {
    const ms = new MiniSearch<SearchDocument>({
      fields: ["name", "description", "location"],
      storeFields: ["id", "name", "description", "imageUrl", "stock", "needsRepair", "location", "categoryId", "categoryName", "createdAt"],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });
    ms.addAll(docs);
    return ms;
  }

  /**
   * Devuelve el índice vigente; lo reconstruye desde la base de datos si venció o fue invalidado.
   *
   * @returns El índice de búsqueda.
   */
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
        location: articles.location,
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
      location: r.location,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      createdAt: r.createdAt,
    }));

    this.index = this.buildIndex(docs);
    this.lastIndexed = now;
    return this.index;
  }

  /**
   * Busca artículos por nombre o descripción.
   *
   * @param query - Texto a buscar; si está vacío no se consulta nada.
   * @returns Los artículos que coinciden, del más al menos relevante.
   */
  async search(query: string): Promise<SearchDocument[]> {
    if (!query.trim()) return [];
    const ms = await this.getIndex();
    const results = ms.search(query);
    return results as unknown as SearchDocument[];
  }

  /**
   * Descarta el índice para que se reconstruya en la siguiente búsqueda.
   * Debe llamarse tras crear, editar o borrar artículos y categorías.
   */
  invalidate(): void {
    this.index = null;
    this.lastIndexed = 0;
  }
}

export const searchService = new SearchService();
