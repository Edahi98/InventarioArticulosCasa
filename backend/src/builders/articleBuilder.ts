import { NewArticle } from "../db/schema.js";

export default class ArticleBuilder {
  private name = "";
  private description = "";
  private imageUrl = "";
  private categoryId = 0;
  private stock = 0;
  private needsRepair = false;

  setName(name: string): this {
    this.name = name?.trim() ?? "";
    return this;
  }

  setDescription(description: string): this {
    this.description = description?.trim() ?? "";
    return this;
  }

  setImageUrl(imageUrl: string): this {
    this.imageUrl = imageUrl?.trim() ?? "";
    return this;
  }

  setCategoryId(categoryId: number): this {
    this.categoryId = categoryId;
    return this;
  }

  setStock(stock: number): this {
    this.stock = stock;
    return this;
  }

  setNeedsRepair(needsRepair: boolean): this {
    this.needsRepair = needsRepair;
    return this;
  }

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
    };
  }
}
