import type { Object3D } from "three";

export type SolidShape =
  | { shape: "box"; size: [number, number, number]; offset: [number, number, number] }
  | { shape: "cylinder"; radius: number; height: number; offset: [number, number, number] };

export class Solid {
  /**
   * Marca un objeto de la escena como sólido: al caminar en primera persona no se puede atravesar. La forma se
   * mide en el espacio local del objeto, así que sigue su posición, giro y tamaño.
   *
   * @param object - Objeto que debe chocar.
   * @param solid - Caja o cilindro que lo envuelve, con su desplazamiento local.
   * @returns El mismo objeto, para encadenar.
   */
  static mark<T extends Object3D>(object: T, solid: SolidShape): T {
    object.userData.solid = solid;
    return object;
  }

  /**
   * @param object - Objeto cualquiera de la escena.
   * @returns La forma sólida con que se marcó, o `null` si no choca.
   */
  static of(object: Object3D): SolidShape | null {
    return (object.userData.solid as SolidShape | undefined) ?? null;
  }
}
