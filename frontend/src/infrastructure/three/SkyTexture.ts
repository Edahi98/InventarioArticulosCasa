import { CanvasTexture, SRGBColorSpace } from "three";

export interface SkyPalette {
  top: string;
  mid: string;
  horizon: string;
}

const DUSK: SkyPalette = { top: "#b9a4f2", mid: "#ffb3cb", horizon: "#ffe3d6" };
const HEIGHT = 256;

export class SkyTexture {
  /**
   * Cielo en degradado vertical.
   *
   * @param palette - Colores de arriba, del medio y del horizonte; por defecto, el atardecer rosa.
   * @returns La textura; quien la use debe liberarla con `dispose()`.
   */
  static create(palette: SkyPalette = DUSK): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 2;
    surface.height = HEIGHT;
    SkyTexture.draw(surface, palette);
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  /**
   * Vuelve a pintar un cielo ya creado, por ejemplo cuando cambia la hora del día.
   *
   * @param texture - Textura creada con `create`.
   * @param palette - Nuevos colores.
   */
  static paint(texture: CanvasTexture, palette: SkyPalette): void {
    SkyTexture.draw(texture.image as HTMLCanvasElement, palette);
    texture.needsUpdate = true;
  }

  private static draw(surface: HTMLCanvasElement, palette: SkyPalette): void {
    const context = surface.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, palette.top);
    gradient.addColorStop(0.45, palette.mid);
    gradient.addColorStop(1, palette.horizon);
    context.fillStyle = gradient;
    context.fillRect(0, 0, surface.width, HEIGHT);
  }
}
