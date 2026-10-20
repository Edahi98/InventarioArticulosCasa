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
   * @param minOuter - Mínimo de lotes en el lado de afuera, donde se reservan las uniones, el
   * comercio y la estación receptora; la calle crece hasta que quepan.
   * @returns Las posiciones, la curva de la calle y las medidas de la isla.
   */
  static plan(count: number, rng: SeededRandom, minOuter = 0): RingPlan {
    const phases = [rng.between(0, Math.PI * 2), rng.between(0, Math.PI * 2), rng.between(0, Math.PI * 2)] as const;
    const wobble = (theta: number): number =>
      1 + 0.07 * Math.sin(2 * theta + phases[0]) + 0.045 * Math.sin(3 * theta + phases[1]);

    const wanted = Math.max(minOuter, 0);
    let road = MIN_ROAD_RADIUS;
    let outer = 0;
    let inner = 0;
    for (let guard = 0; guard < 400; guard += 1) {
      const outerCapacity = RingLayout.capacity(road + LOT_OFFSET);
      const innerCapacity = RingLayout.capacity(road - LOT_OFFSET);
      outer = Math.min(outerCapacity, Math.max(wanted, count - innerCapacity));
      inner = count - outer;
      if (outer >= wanted && inner >= 0 && inner <= innerCapacity) break;
      road += 0.25;
    }

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

  /**
   * Mueve un plan completo (lotes y calle) a otro centro, para armar varias islas con el mismo trazo.
   *
   * @param plan - Plan armado alrededor del origen.
   * @param x - Desplazamiento en x.
   * @param z - Desplazamiento en z.
   * @returns Un plan nuevo con los lotes y la curva desplazados; las medidas no cambian.
   */
  static shift(plan: RingPlan, x: number, z: number): RingPlan {
    return {
      ...plan,
      slots: plan.slots.map((slot) => ({ ...slot, x: slot.x + x, z: slot.z + z })),
      curve: new CatmullRomCurve3(
        plan.curve.points.map((point) => new Vector3(point.x + x, point.y, point.z + z)),
        true,
        "centripetal",
      ),
    };
  }

  /**
   * Gira un plan completo alrededor de su centro (el origen), para que un lote quede mirando hacia donde se necesita.
   *
   * @param plan - Plan armado alrededor del origen.
   * @param angle - Giro en radianes, en el mismo sentido que `Math.atan2(z, x)`.
   * @returns Un plan nuevo con los lotes, sus orientaciones y la curva girados.
   */
  static rotate(plan: RingPlan, angle: number): RingPlan {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const turn = (x: number, z: number): [number, number] => [x * cos - z * sin, x * sin + z * cos];
    return {
      ...plan,
      slots: plan.slots.map((slot) => {
        const [x, z] = turn(slot.x, slot.z);
        return { x, z, yaw: slot.yaw - angle };
      }),
      curve: new CatmullRomCurve3(
        plan.curve.points.map((point) => {
          const [x, z] = turn(point.x, point.z);
          return new Vector3(x, point.y, z);
        }),
        true,
        "centripetal",
      ),
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
