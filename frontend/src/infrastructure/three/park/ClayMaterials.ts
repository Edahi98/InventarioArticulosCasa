import { MeshStandardMaterial } from "three";

export class ClayMaterials {
  private readonly cache = new Map<number, MeshStandardMaterial>();

  /**
   * @param color - Color hexadecimal.
   * @returns Un material suave como de plastilina de ese color, reutilizado entre las figuras.
   */
  get(color: number): MeshStandardMaterial {
    const cached = this.cache.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.62 });
    this.cache.set(color, created);
    return created;
  }
}
