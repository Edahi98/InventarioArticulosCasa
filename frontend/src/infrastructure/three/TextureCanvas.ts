import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { SeededRandom } from "./neighborhood/SeededRandom.js";

export type Painter = (context: CanvasRenderingContext2D, rng: SeededRandom, width: number, height: number) => void;

export class TextureCanvas {
  private static readonly cache = new Map<string, CanvasTexture>();

  /**
   * Dibuja una textura con canvas y la guarda para reutilizarla en todas las escenas.
   *
   * @param key - Nombre único de la textura; también es la semilla del azar, así que siempre sale igual.
   * @param width - Ancho en píxeles.
   * @param height - Alto en píxeles.
   * @param tiled - Si se repite en mosaico (`RepeatWrapping`).
   * @param paint - Función que dibuja sobre el canvas.
   * @returns La textura, en espacio de color sRGB.
   */
  static build(key: string, width: number, height: number, tiled: boolean, paint: Painter): CanvasTexture {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context) paint(context, new SeededRandom(key), width, height);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    if (tiled) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    }
    this.cache.set(key, texture);
    return texture;
  }
}
