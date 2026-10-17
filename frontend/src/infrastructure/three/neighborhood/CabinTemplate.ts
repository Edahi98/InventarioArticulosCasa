import { Group } from "three";
import type { BuiltHouse, HouseContext, HouseTemplate } from "./HouseTemplate.js";

export class CabinTemplate implements HouseTemplate {
  readonly id = "cabin";

  /**
   * Cabaña en A: el techo llega hasta el piso, con puerta, ventana alta, terraza y a veces barandal.
   *
   * @param context - Colores, azar y piezas de la casa.
   * @returns La casa con sus medidas.
   */
  build({ style, rng, parts }: HouseContext): Omit<BuiltHouse, "glass" | "templateId"> {
    const width = rng.between(1.6, 1.9);
    const height = rng.between(1.7, 2.1);
    const depth = rng.between(1.5, 1.8);
    const front = depth / 2 + 0.02;
    const group = new Group();
    const door = parts.door(0.34, 0.66, style.door, [0, 0.33, front + 0.02]);
    const pipeY = height * 0.64 + 0.15;

    group.add(
      parts.gableRoof(width, depth, height, 0, style.roof),
      parts.box([width * 0.34, height * 0.4, 0.06], style.wall, [0, height * 0.2, front]),
      door.group,
      parts.pole(0.07, 0.6, style.trim, [width * 0.18, pipeY, -depth * 0.1]),
      parts.window(0.3, 0.3, [0, height * 0.55, front - 0.06]),
      parts.box([width + 0.3, 0.08, 0.6], style.trim, [0, 0.04, front + 0.3]),
    );
    if (rng.chance(0.6)) {
      [-1, 1].forEach((side) =>
        group.add(parts.pole(0.03, 0.4, style.trim, [side * (width / 2 + 0.1), 0.25, front + 0.55])),
      );
      group.add(parts.box([width + 0.3, 0.05, 0.04], style.trim, [0, 0.45, front + 0.55]));
    }
    return {
      group,
      width: width + 0.3,
      depth: depth + 0.6,
      height,
      door: door.swing,
      chimney: [width * 0.18, pipeY + 0.35, -depth * 0.1],
    };
  }
}
