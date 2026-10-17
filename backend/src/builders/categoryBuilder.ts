import { categories, type Category, type NewCategory } from "../db/schema.js";

export default class CategoryBuilder {
  private name = "";
  private description = "";
  private imageUrl = "";
  private location = "";

  /**
   * @param name - Nombre de la categoría; se recortan los espacios.
   * @returns El mismo builder.
   */
  setName(name: string): this {
    this.name = name.trim();
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
   * @param location - Dónde está guardada la categoría; se recortan los espacios.
   * @returns El mismo builder.
   */
  setLocation(location: string): this {
    this.location = location?.trim() ?? "";
    return this;
  }

  /**
   * Valida los datos y construye la categoría.
   *
   * @returns La categoría lista para insertar.
   * @throws Error si falta el nombre.
   */
  build(): NewCategory {
    if (!this.name) {
      throw new Error("El nombre de la categoría es obligatorio.");
    }
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      location: this.location,
    };
  }
}
