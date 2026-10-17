import { CatmullRomCurve3, Vector3 } from "three";
import type { SeededRandom } from "./SeededRandom.js";

export interface LotSlot {
  x: number;
  z: number;
  yaw: number;
}

export interface RingPlan {
  slots: LotSlot[];
  curve: CatmullRomCurve3;
  roadRadius: number;
  islandRadius: number;
  plazaRadius: number;
}

export const LOT_OFFSET = 3.05;
const SPACING = 3.95;
const MIN_ROAD_RADIUS = 5.2;
const CURVE_POINTS = 56;

export class RingLayout {
  /**
   * Reparte las casas a ambos lados de una calle sinuosa en forma de anillo. La calle crece con
   * el número de casas, y las del lado de afuera y las de adentro miran hacia ella.
   *
   * @param count - Número de casas.
   * @param rng - Azar con semilla, para que la forma del barrio no cambie.
   * @returns Las posiciones, la curva de la calle y las medidas de la isla.
   */
  static plan(count: number, rng: SeededRandom): RingPlan {
    const phases = [rng.between(0, Math.PI * 2), rng.between(0, Math.PI * 2), rng.between(0, Math.PI * 2)] as const;
    const wobble = (theta: number): number =>
      1 + 0.07 * Math.sin(2 * theta + phases[0]) + 0.045 * Math.sin(3 * theta + phases[1]);

    let road = MIN_ROAD_RADIUS;
    while (RingLayout.capacity(road + LOT_OFFSET) + RingLayout.capacity(road - LOT_OFFSET) < count) road += 0.25;
    const outerCapacity = RingLayout.capacity(road + LOT_OFFSET);
    const innerCapacity = RingLayout.capacity(road - LOT_OFFSET);
    const outer = Math.min(outerCapacity, Math.ceil((count * outerCapacity) / (outerCapacity + innerCapacity)));
    const inner = count - outer;

    const slots = [
      ...RingLayout.side(outer, road, LOT_OFFSET, 1, phases[2], rng, wobble),
      ...RingLayout.side(inner, road, LOT_OFFSET, -1, phases[2] + Math.PI / Math.max(inner, 1), rng, wobble),
    ];
    const points = Array.from({ length: CURVE_POINTS }, (_, index) => {
      const theta = (index / CURVE_POINTS) * Math.PI * 2;
      const radius = road * wobble(theta);
      return new Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    });
    return {
      slots,
      curve: new CatmullRomCurve3(points, true, "centripetal"),
      roadRadius: road,
      islandRadius: road * 1.1 + LOT_OFFSET + 2.7,
      plazaRadius: Math.max(road * 0.9 - LOT_OFFSET - 1.9, 0),
    };
  }

  private static capacity(radius: number): number {
    return Math.max(Math.floor((Math.PI * 2 * radius) / SPACING), 0);
  }

  private static side(
    amount: number,
    road: number,
    offset: number,
    direction: 1 | -1,
    phase: number,
    rng: SeededRandom,
    wobble: (theta: number) => number,
  ): LotSlot[] {
    return Array.from({ length: amount }, (_, index) => {
      const theta = phase + (index / amount) * Math.PI * 2;
      const radius = road * wobble(theta) + direction * (offset + rng.between(-0.12, 0.12));
      const towardRoad = { x: -direction * Math.cos(theta), z: -direction * Math.sin(theta) };
      return {
        x: Math.cos(theta) * radius,
        z: Math.sin(theta) * radius,
        yaw: Math.atan2(towardRoad.x, towardRoad.z) + rng.between(-0.07, 0.07),
      };
    });
  }
}
