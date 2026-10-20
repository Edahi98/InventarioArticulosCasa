import { MeshStandardMaterial } from "three";
import { SurfaceTextures } from "../SurfaceTextures.js";

const ROPE = 0xd9b98a;

export class CraftMaterials {
  private static readonly cache = new Map<string, MeshStandardMaterial>();

  /**
   * @param color - Color de la madera.
   * @returns Madera con vetas (tablones, postes, balsas), compartida.
   */
  static wood(color = 0xc4805a): MeshStandardMaterial {
    return this.cached(`madera-${color}`, () => new MeshStandardMaterial({ color, roughness: 0.8, map: SurfaceTextures.bark(), bumpMap: SurfaceTextures.bark(), bumpScale: 0.6 }));
  }

  /**
   * @returns Cuerda trenzada clara, compartida.
   */
  static rope(): MeshStandardMaterial {
    return this.cached("cuerda", () => new MeshStandardMaterial({ color: ROPE, roughness: 0.9, map: SurfaceTextures.fur(), bumpMap: SurfaceTextures.fur(), bumpScale: 0.5 }));
  }

  /**
   * @param color - Color de la pintura.
   * @returns Pintura de plastilina con grano fino, compartida.
   */
  static paint(color: number): MeshStandardMaterial {
    return this.cached(`pintura-${color}`, () => new MeshStandardMaterial({ color, roughness: 0.55, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.3 }));
  }

  /**
   * @returns Vidrio de farolito que brilla de noche; cada llamada crea uno para sumarlo a las luces del barrio.
   */
  static lantern(): MeshStandardMaterial {
    return new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.4 });
  }

  private static cached(key: string, create: () => MeshStandardMaterial): MeshStandardMaterial {
    const found = this.cache.get(key);
    if (found) return found;
    const made = create();
    this.cache.set(key, made);
    return made;
  }
}
