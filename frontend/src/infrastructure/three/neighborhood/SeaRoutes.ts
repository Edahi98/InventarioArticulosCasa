import { CatmullRomCurve3, Vector3 } from "three";
import { SEA_SHELF_REACH, SEA_ISLAND_MARGIN, SEA_LINK_MARGIN, SEA_LOOPS_MAX } from "../../../constantes/barrio_constantes.js";
import type { SeaSegment } from "./IslandLinks.js";
import type { IslandCircle } from "./Sparkles.js";

export interface SeaLoop {
  curve: CatmullRomCurve3;
  x: number;
  z: number;
  room: number;
}

const WATER_Y = -1.35;
const SAMPLES = 72;

export class SeaRoutes {
  /**
   * Busca rutas de agua que no crucen islas, islitas, puentes ni conexiones: una vuelta grande y ondulada alrededor
   * de todo el archipiélago y unos cuantos circuitos ovalados en los huecos de agua entre las islas.
   *
   * @param islands - Círculos de las islas e islitas.
   * @param segments - Tramos rectos de puentes y conexiones entre orillas.
   * @param extent - Radio que abarca todo el archipiélago.
   * @returns La vuelta exterior y los circuitos entre islas, ya comprobados.
   */
  static plan(islands: IslandCircle[], segments: SeaSegment[], extent: number): { orbit: CatmullRomCurve3; loops: SeaLoop[] } {
    let radius = extent + 4;
    let orbit = SeaRoutes.ellipse(0, 0, radius, radius * 0.92, 0);
    for (let tries = 0; tries < 6 && !SeaRoutes.clear(orbit, islands, segments); tries += 1) {
      radius += 2;
      orbit = SeaRoutes.ellipse(0, 0, radius, radius * 0.92, 0);
    }
    const loops: SeaLoop[] = [];
    const shapes: [number, number][] = [
      [3.6, 2.4],
      [2.8, 2],
    ];
    for (let ring = 0; ring < 5 && loops.length < SEA_LOOPS_MAX; ring += 1) {
      const distance = extent * (0.35 + ring * 0.13);
      for (let step = 0; step < 36 && loops.length < SEA_LOOPS_MAX; step += 1) {
        const angle = (step / 36) * Math.PI * 2 + ring * 0.37;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        if (loops.some((loop) => Math.hypot(loop.x - x, loop.z - z) < 12)) continue;
        const fit = shapes.find(([long, short]) => SeaRoutes.clear(SeaRoutes.ellipse(x, z, long, short, angle + Math.PI / 2), islands, segments));
        if (!fit) continue;
        loops.push({ curve: SeaRoutes.ellipse(x, z, fit[0], fit[1], angle + Math.PI / 2), x, z, room: fit[1] });
      }
    }
    return { orbit, loops };
  }

  private static ellipse(x: number, z: number, long: number, short: number, turn: number): CatmullRomCurve3 {
    const points = Array.from({ length: 28 }, (_, index) => {
      const angle = (index / 28) * Math.PI * 2;
      const wobble = 1 + 0.05 * Math.sin(angle * 3);
      const a = Math.cos(angle) * long * wobble;
      const b = Math.sin(angle) * short * wobble;
      return new Vector3(x + a * Math.cos(turn) - b * Math.sin(turn), WATER_Y, z + a * Math.sin(turn) + b * Math.cos(turn));
    });
    return new CatmullRomCurve3(points, true, "centripetal");
  }

  private static clear(curve: CatmullRomCurve3, islands: IslandCircle[], segments: SeaSegment[]): boolean {
    return curve.getSpacedPoints(SAMPLES).every(
      (point) =>
        islands.every((island) => Math.hypot(point.x - island.x, point.z - island.z) > island.radius * SEA_SHELF_REACH + SEA_ISLAND_MARGIN) &&
        segments.every((segment) => SeaRoutes.distance(point, segment) > SEA_LINK_MARGIN),
    );
  }

  private static distance(point: Vector3, segment: SeaSegment): number {
    const dx = segment.to.x - segment.from.x;
    const dz = segment.to.z - segment.from.z;
    const length = dx * dx + dz * dz;
    const t = length === 0 ? 0 : Math.min(Math.max(((point.x - segment.from.x) * dx + (point.z - segment.from.z) * dz) / length, 0), 1);
    return Math.hypot(point.x - (segment.from.x + dx * t), point.z - (segment.from.z + dz * t));
  }
}
