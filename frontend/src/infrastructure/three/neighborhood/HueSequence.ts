const GOLDEN_TURN = 0.381966;
const HUE_OFFSET = 0.93;

export class HueSequence {
  /**
   * Matiz de una categoría: la secuencia del ángulo áureo separa lo más posible a las categorías
   * entre sí, así que dos casas nunca se parecen aunque tengan ids seguidos.
   *
   * @param id - Identificador de la categoría.
   * @returns El matiz entre 0 y 1.
   */
  static hueOf(id: number): number {
    return (((id * GOLDEN_TURN + HUE_OFFSET) % 1) + 1) % 1;
  }

  /**
   * @param id - Identificador de la categoría.
   * @returns El color de la casa como valor CSS, para las etiquetas fuera del 3D.
   */
  static cssOf(id: number): string {
    return `hsl(${Math.round(HueSequence.hueOf(id) * 360)} 68% 52%)`;
  }
}
