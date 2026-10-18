import { Group, MathUtils, MeshStandardMaterial, Vector3, type Curve } from "three";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { ToyCar, type CarKind } from "./ToyCar.js";

export interface TrafficCar {
  id: number;
  group: Group;
  driver: Group;
  seat: Vector3;
}

interface Blend {
  x: number;
  z: number;
  rotation: number;
  start: number;
}

interface Driver {
  group: Group;
  head: Group;
  driver: Group;
  seat: Vector3;
  controlled: boolean;
  blend: Blend | null;
  bob: number;
  direction: 1 | -1;
  speed: number;
  start: number;
}

const COLORS = [0xff4f8b, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x7fd0a0, 0xffb066] as const;
const KINDS: CarKind[] = ["vocho", "pickup", "vocho", "camioneta", "vocho", "sedan"];
const VOCHO_COLORS = [0xe8502d, 0x2a2233, 0xffe35c, 0x7fd0ea, 0xff8fb7] as const;
const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];

export class Traffic {
  readonly group = new Group();
  private readonly drivers: Driver[] = [];
  private clock = 0;
  private readonly lights: MeshStandardMaterial[] = [];
  private readonly length: number;

  /**
   * @param curve - Curva cerrada de la calle.
   * @param roadWidth - Ancho de la calle, para repartir los dos carriles.
   * @param cars - Cuántos coches circulan; la mitad va en sentido contrario.
   */
  constructor(
    private readonly curve: Curve<Vector3>,
    private readonly roadWidth: number,
    cars: number,
  ) {
    const rng = new SeededRandom("trafico");
    this.length = curve.getLength();
    for (let index = 0; index < cars; index += 1) {
      const { group, headlights, head, driver, seat } = ToyCar.build(KINDS[index % KINDS.length] === "vocho" ? (VOCHO_COLORS[index % VOCHO_COLORS.length] as number) : rng.pick(COLORS), KINDS[index % KINDS.length], TONES[index % TONES.length], index);
      this.group.add(group);
      this.lights.push(headlights);
      this.drivers.push({ group, head, driver, seat, controlled: false, blend: null, bob: rng.between(0, 6), direction: index % 2 === 0 ? 1 : -1, speed: rng.between(0.8, 1.5), start: (index / cars + rng.between(0, 0.05)) % 1 });
    }
  }

  /**
   * Hace avanzar a los coches por su carril, siguiendo la curva de la calle, y enciende los faros de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` los coches quedan quietos (movimiento reducido).
   */
  /**
   * @returns Los coches de la calle con su asiento, para poder subirse a ellos.
   */
  get cars(): TrafficCar[] {
    return this.drivers.map((driver, id) => ({ id, group: driver.group, driver: driver.driver, seat: driver.seat }));
  }

  /**
   * Entrega un coche a quien lo va a manejar: deja de circular solo.
   *
   * @param id - Posición del coche en `cars`.
   */
  take(id: number): void {
    const driver = this.drivers[id];
    if (!driver) return;
    driver.controlled = true;
    driver.blend = null;
  }

  /**
   * Devuelve un coche a la calle: toma el punto más cercano de la ruta y el sentido en que apunta, y se
   * incorpora al tráfico con una transición suave desde donde quedó estacionado.
   *
   * @param id - Posición del coche en `cars`.
   */
  leave(id: number): void {
    const driver = this.drivers[id];
    if (!driver) return;
    const here = driver.group.position;
    let best = 0;
    let nearest = Infinity;
    for (let step = 0; step < 240; step += 1) {
      const point = this.curve.getPointAt(step / 240);
      const distance = (point.x - here.x) ** 2 + (point.z - here.z) ** 2;
      if (distance < nearest) {
        nearest = distance;
        best = step / 240;
      }
    }
    const { tangent } = RoadBuilder.frame(this.curve, best);
    const heading = new Vector3(Math.cos(driver.group.rotation.y), 0, -Math.sin(driver.group.rotation.y));
    driver.direction = heading.dot(tangent) >= 0 ? 1 : -1;
    driver.start = best - (driver.direction * this.clock * driver.speed) / this.length;
    driver.blend = { x: here.x, z: here.z, rotation: driver.group.rotation.y, start: this.clock };
    driver.controlled = false;
  }

  update(elapsed: number, night: number, moving: boolean): void {
    this.clock = elapsed;
    this.drivers.forEach((driver) => {
      if (driver.controlled) return;
      const progress = driver.start + (moving ? (driver.direction * elapsed * driver.speed) / this.length : 0);
      const { point, tangent, normal } = RoadBuilder.frame(this.curve, progress);
      const lane = driver.direction * -this.roadWidth * 0.22;
      driver.group.position.set(point.x + normal.x * lane, 0.08, point.z + normal.z * lane);
      driver.group.rotation.y = Math.atan2(-tangent.z * driver.direction, tangent.x * driver.direction);
      if (driver.blend) {
        const mix = MathUtils.clamp((elapsed - driver.blend.start) / 1.4, 0, 1);
        const swing = Math.atan2(Math.sin(driver.group.rotation.y - driver.blend.rotation), Math.cos(driver.group.rotation.y - driver.blend.rotation));
        driver.group.position.x = MathUtils.lerp(driver.blend.x, driver.group.position.x, mix);
        driver.group.position.z = MathUtils.lerp(driver.blend.z, driver.group.position.z, mix);
        driver.group.rotation.y = driver.blend.rotation + swing * mix;
        if (mix >= 1) driver.blend = null;
      }
      driver.head.rotation.z = moving ? Math.sin(elapsed * 4 + driver.bob) * 0.1 : 0;
    });
    const glow = 0.3 + MathUtils.clamp(night, 0, 1) * 2.2;
    this.lights.forEach((light) => {
      light.emissiveIntensity = glow;
    });
  }
}
