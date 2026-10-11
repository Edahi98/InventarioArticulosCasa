import ExcelWorkbookBuilder from "../builders/excelWorkbookBuilder.js";
import { db, articles, categories } from "../db/client.js";

export class ExcelReportService {
  /**
   * Genera el libro de Excel con las hojas de categorías y artículos.
   *
   * @returns El archivo `.xlsx` como buffer.
   */
  async generateInventoryReport(): Promise<Buffer> {
    const [categoryRows, articleRows] = await Promise.all([
      db.select().from(categories),
      db.select().from(articles),
    ]);

    return new ExcelWorkbookBuilder()
      .addCategoriesSheet(categoryRows)
      .addArticlesSheet(articleRows)
      .build();
  }
}

export const excelReportService = new ExcelReportService();
