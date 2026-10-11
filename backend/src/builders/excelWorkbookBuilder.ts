import ExcelJS from "exceljs";

export default class ExcelWorkbookBuilder {
  private readonly workbook = new ExcelJS.Workbook();

  /**
   * Agrega la hoja «Categorías».
   *
   * @param rows - Categorías a listar.
   * @returns El mismo builder.
   */
  addCategoriesSheet(rows: { id: number; name: string; description: string; imageUrl: string; createdAt: string }[]): this {
    const sheet = this.workbook.addWorksheet("Categorías");
    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nombre", key: "name", width: 30 },
      { header: "Descripción", key: "description", width: 40 },
      { header: "Imagen", key: "imageUrl", width: 50 },
      { header: "Creado", key: "createdAt", width: 22 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    return this;
  }

  /**
   * Agrega la hoja «Artículos».
   *
   * @param rows - Artículos a listar.
   * @returns El mismo builder.
   */
  addArticlesSheet(rows: { id: number; name: string; description: string; imageUrl: string; categoryId: number; createdAt: string }[]): this {
    const sheet = this.workbook.addWorksheet("Artículos");
    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nombre", key: "name", width: 30 },
      { header: "Descripción", key: "description", width: 40 },
      { header: "Imagen", key: "imageUrl", width: 50 },
      { header: "ID Categoría", key: "categoryId", width: 14 },
      { header: "Creado", key: "createdAt", width: 22 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    return this;
  }

  /**
   * Serializa el libro.
   *
   * @returns El archivo `.xlsx` como buffer.
   */
  async build(): Promise<Buffer> {
    const buffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
