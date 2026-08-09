import { categories, type Category, type NewCategory } from "../db/schema.js";

export default class CategoryBuilder {
  private name = "";
  private description = "";
  private imageUrl = "";

  setName(name: string): this {
    this.name = name.trim();
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

  build(): NewCategory {
    if (!this.name) {
      throw new Error("El nombre de la categoría es obligatorio.");
    }
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
    };
  }
}
