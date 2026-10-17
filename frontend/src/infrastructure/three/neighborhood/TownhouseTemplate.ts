import { Group } from "three";
import type { BuiltHouse, HouseContext, HouseTemplate } from "./HouseTemplate.js";

export class TownhouseTemplate implements HouseTemplate {
  readonly id = "townhouse";

  /**
   * Casa de ciudad: alta y angosta, techo plano con pretil, toldo sobre la puerta y a veces balcón.
   *
   * @param context - Colores, azar y piezas de la casa.
   * @returns La casa con sus medidas.
   */
  build({ style, rng, parts }: HouseContext): Omit<BuiltHouse, "glass" | "templateId"> {
    const width = rng.between(1.3, 1.6);
    const height = rng.between(2, 2.6);
    const depth = 1.5;
    const front = depth / 2 + 0.02;
    const floors = Math.max(2, Math.floor(height / 0.85));
    const group = new Group();
    const door = parts.door(0.4, 0.72, style.door, [0, 0.36, front]);

    group.add(
      parts.box([width, height, depth], style.wall, [0, height / 2, 0]),
      parts.box([width + 0.12, 0.14, depth + 0.12], style.trim, [0, height + 0.07, 0]),
      parts.box([0.24, 0.5, 0.24], style.roof, [width * 0.25, height + 0.39, -0.3]),
      door.group,
      parts.box([0.74, 0.08, 0.42], style.roof, [0, 0.9, front + 0.18]),
    );
    for (let floor = 1; floor < floors; floor += 1) {
      const y = 0.35 + floor * 0.78;
      group.add(
        parts.window(0.3, 0.38, [-width * 0.28, y, front]),
        parts.window(0.3, 0.38, [width * 0.28, y, front]),
      );
    }
    if (rng.chance(0.55)) {
      const y = 0.35 + 0.78 - 0.28;
      group.add(
        parts.box([width * 0.9, 0.06, 0.34], style.trim, [0, y, front + 0.16]),
        parts.box([width * 0.9, 0.2, 0.04], style.roof, [0, y + 0.13, front + 0.32]),
      );
    }
    return {
      group,
      width: width + 0.12,
      depth: depth + 0.12,
      height: height + 0.4,
      door: door.swing,
      chimney: [width * 0.25, height + 0.39 + 0.32, -0.3],
    };
  }
}
