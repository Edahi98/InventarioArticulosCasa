import { Group } from "three";
import type { BuiltHouse, HouseContext, HouseTemplate } from "./HouseTemplate.js";

export class CottageTemplate implements HouseTemplate {
  readonly id = "cottage";

  /**
   * Casita de campo: un piso, techo de dos aguas, puerta al lado y, a veces, chimenea y jardinera.
   *
   * @param context - Colores, azar y piezas de la casa.
   * @returns La casa con sus medidas.
   */
  build({ style, rng, parts }: HouseContext): Omit<BuiltHouse, "glass" | "templateId"> {
    const width = rng.between(1.7, 2.1);
    const height = rng.between(1.1, 1.4);
    const depth = rng.between(1.6, 1.9);
    const roofHeight = rng.between(0.75, 1);
    const front = depth / 2 + 0.02;
    const group = new Group();
    const door = parts.door(0.38, 0.72, style.door, [width * 0.2, 0.36, front]);
    const chimneyY = height + roofHeight * 0.55;

    group.add(
      parts.box([width, height, depth], style.wall, [0, height / 2, 0]),
      parts.gableRoof(width + 0.25, depth + 0.3, roofHeight, height, style.roof),
      door.group,
      parts.box([0.26, 0.7, 0.26], style.roof, [width * 0.28, chimneyY, -depth * 0.15]),
      parts.box([0.6, 0.07, 0.3], style.trim, [width * 0.2, 0.035, front + 0.14]),
      parts.window(0.34, 0.34, [-width * 0.26, height * 0.6, front]),
      parts.window(0.3, 0.3, [width * 0.4, height * 0.62, front]),
    );
    if (rng.chance(0.55)) {
      group.add(parts.box([0.46, 0.1, 0.14], style.door, [-width * 0.26, height * 0.6 - 0.26, front + 0.05]));
    }
    return {
      group,
      width: width + 0.25,
      depth: depth + 0.3,
      height: height + roofHeight,
      door: door.swing,
      chimney: [width * 0.28, chimneyY + 0.4, -depth * 0.15],
    };
  }
}
