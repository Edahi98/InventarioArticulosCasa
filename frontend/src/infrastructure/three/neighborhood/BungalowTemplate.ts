import { Group } from "three";
import type { BuiltHouse, HouseContext, HouseTemplate } from "./HouseTemplate.js";

export class BungalowTemplate implements HouseTemplate {
  readonly id = "bungalow";

  /**
   * Bungalow: largo y bajo, techo de cuatro aguas, porche con postes y, a veces, cochera.
   *
   * @param context - Colores, azar y piezas de la casa.
   * @returns La casa con sus medidas.
   */
  build({ style, rng, parts }: HouseContext): Omit<BuiltHouse, "glass" | "templateId"> {
    const width = rng.between(2.3, 2.8);
    const height = rng.between(0.85, 1.05);
    const depth = 1.5;
    const roofHeight = rng.between(0.5, 0.7);
    const front = depth / 2 + 0.02;
    const side = rng.chance(0.5) ? -1 : 1;
    const group = new Group();
    const door = parts.door(0.4, 0.66, style.door, [side * width * 0.12, 0.33, front]);
    const chimneyX = -side * width * 0.3;
    const chimneyY = height + roofHeight * 0.45 + 0.1;

    group.add(
      parts.box([width, height, depth], style.wall, [0, height / 2, 0]),
      parts.hipRoof(width + 0.3, depth + 0.3, roofHeight, height, style.roof),
      parts.box([0.26, 0.7, 0.26], style.roof, [chimneyX, chimneyY, -0.2]),
      door.group,
      parts.window(0.5, 0.32, [-side * width * 0.28, height * 0.58, front]),
      parts.box([0.95, 0.06, 0.5], style.trim, [side * width * 0.12, 0.03, front + 0.25]),
      parts.pole(0.035, height * 0.8, style.trim, [side * width * 0.12 - 0.4, height * 0.4, front + 0.46]),
      parts.pole(0.035, height * 0.8, style.trim, [side * width * 0.12 + 0.4, height * 0.4, front + 0.46]),
      parts.box([1.05, 0.06, 0.58], style.roof, [side * width * 0.12, height * 0.82, front + 0.25]),
    );
    if (rng.chance(0.55)) {
      group.add(parts.box([0.8, 0.6, 0.05], style.trim, [-side * width * 0.3, 0.3, front]));
    }
    return {
      group,
      width: width + 0.3,
      depth: depth + 0.6,
      height: height + roofHeight,
      door: door.swing,
      chimney: [chimneyX, chimneyY + 0.4, -0.2],
    };
  }
}
