import { NewArticle } from "../db/schema.js";

export default class ArticleBuilder {
  private name = "";
  private description = "";
  private imageUrl = "";
  private categoryId = 0;
  private stock = 0;
  private needsRepair = false;
  private location = "";

  /**
   * @param name - Nombre del artículo; se recortan los espacios.
   * @returns El mismo builder.
   */
  setName(name: string): this {
    this.name = name?.trim() ?? "";
    return this;
  }

  /**
   * @param description - Descripción; se recortan los espacios.
   * @returns El mismo builder.
   */
  setDescription(description: string): this {
    this.description = description?.trim() ?? "";
    return this;
  }

  /**
   * @param imageUrl - URL de la imagen; se recortan los espacios.
   * @returns El mismo builder.
   */
  setImageUrl(imageUrl: string): this {
    this.imageUrl = imageUrl?.trim() ?? "";
    return this;
  }

  /**
   * @param categoryId - Identificador de la categoría.
   * @returns El mismo builder.
   */
  setCategoryId(categoryId: number): this {
    this.categoryId = categoryId;
    return this;
  }

  /**
   * @param stock - Cantidad en inventario.
   * @returns El mismo builder.
   */
  setStock(stock: number): this {
    this.stock = stock;
    return this;
  }

  /**
   * @param needsRepair - Si el artículo necesita reparación.
   * @returns El mismo builder.
   */
  setNeedsRepair(needsRepair: boolean): this {
    this.needsRepair = needsRepair;
    return this;
  }

  /**
   * @param location - Dónde está guardado el artículo; se recortan los espacios.
   * @returns El mismo builder.
   */
  setLocation(location: string): this {
    this.location = location?.trim() ?? "";
    return this;
  }

  /**
   * Valida los datos y construye el artículo.
   *
   * @returns El artículo listo para insertar.
   * @throws Error si falta el nombre, la categoría o la imagen, o si el stock no es un entero no negativo.
   */
  build(): NewArticle {
    if (!this.name) {
      throw new Error("El nombre del artículo es obligatorio.");
    }
    if (!this.categoryId || Number.isNaN(this.categoryId)) {
      throw new Error("El artículo debe tener una categoría asociada válida.");
    }
    if (!this.imageUrl) {
      throw new Error("El artículo debe tener una imagen asociada.");
    }
    if (!Number.isInteger(this.stock) || this.stock < 0) {
      throw new Error("El stock debe ser un número entero no negativo.");
    }
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      categoryId: this.categoryId,
      stock: this.stock,
      needsRepair: this.needsRepair,
      location: this.location,
    };
  }
}
