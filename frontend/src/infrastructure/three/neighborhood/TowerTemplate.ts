import { Group } from "three";
import type { BuiltHouse, HouseContext, HouseTemplate } from "./HouseTemplate.js";

export class TowerTemplate implements HouseTemplate {
  readonly id = "tower";

  /**
   * Casa con torre: cuerpo cuadrado, techo cónico, un anexo con techo de dos aguas y a veces bandera.
   *
   * @param context - Colores, azar y piezas de la casa.
   * @returns La casa con sus medidas.
   */
  build({ style, rng, parts }: HouseContext): Omit<BuiltHouse, "glass" | "templateId"> {
    const width = rng.between(1.4, 1.7);
    const height = rng.between(1.5, 1.9);
    const front = width / 2 + 0.02;
    const roofHeight = rng.between(0.9, 1.2);
    const annexSide = rng.chance(0.5) ? -1 : 1;
    const annexHeight = 0.8;
    const annexX = annexSide * (width / 2 + 0.4);
    const annexRoof = parts.gableRoof(1.05, 1.05, 0.5, annexHeight, style.roof);
    annexRoof.position.x = annexX;
    annexRoof.position.z = 0.15;
    const group = new Group();
    const door = parts.door(0.38, 0.7, style.door, [0, 0.35, front]);

    group.add(
      parts.box([width, height, width], style.wall, [0, height / 2, 0]),
      parts.cone(width * 0.78, roofHeight, 8, height, style.roof),
      door.group,
      parts.box([0.22, 0.5, 0.22], style.trim, [annexX + annexSide * 0.2, annexHeight + 0.42, -0.05]),
      parts.window(0.3, 0.34, [0, height * 0.7, front]),
      parts.window(0.28, 0.34, [-width * 0.3, height * 0.34, front]),
      parts.box([0.9, annexHeight, 0.9], style.wall, [annexX, annexHeight / 2, 0.15]),
      annexRoof,
      parts.window(0.26, 0.26, [annexX, annexHeight * 0.55, 0.15 + 0.47]),
    );
    if (rng.chance(0.6)) {
      group.add(
        parts.pole(0.02, 0.5, style.trim, [0, height + roofHeight + 0.2, 0]),
        parts.box([0.28, 0.16, 0.02], style.door, [0.15, height + roofHeight + 0.38, 0]),
      );
    }
    return {
      group,
      width: width + 1.5,
      depth: width + 0.4,
      height: height + roofHeight,
      door: door.swing,
      chimney: [annexX + annexSide * 0.2, annexHeight + 0.42 + 0.35, -0.05],
    };
  }
}
