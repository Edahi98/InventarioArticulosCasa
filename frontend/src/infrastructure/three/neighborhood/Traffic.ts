import { Group, MathUtils, MeshStandardMaterial } from "three";
import { SeededRandom } from "./SeededRandom.js";
import { ToyCar } from "./ToyCar.js";

interface Driver {
  group: Group;
  direction: 1 | -1;
  speed: number;
  start: number;
}

const COLORS = [0xff4f8b, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x7fd0a0, 0xffb066] as const;

export class Traffic {
  readonly group = new Group();
  private readonly drivers: Driver[] = [];
  private readonly lights: MeshStandardMaterial[] = [];
  private readonly span: number;

  /**
   * @param roadsZ - Posición en z del centro de cada calle.
   * @param width - Largo de las calles.
   * @param roadWidth - Ancho de la calle, para repartir los dos carriles.
   */
  constructor(roadsZ: number[], width: number, roadWidth: number) {
    const rng = new SeededRandom("trafico");
    this.span = width + 8;
    roadsZ.forEach((z) => {
      ([1, -1] as const).forEach((direction) => {
        const { group, headlights } = ToyCar.build(rng.pick(COLORS));
        group.position.set(0, 0.05, z + direction * roadWidth * 0.22);
        group.rotation.y = direction === 1 ? 0 : Math.PI;
        this.group.add(group);
        this.lights.push(headlights);
        this.drivers.push({ group, direction, speed: rng.between(0.9, 1.7), start: rng.between(0, this.span) });
      });
    });
  }

  /**
   * Avanza los coches por su carril, dan la vuelta al salir del mapa y prenden los faros de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` los coches quedan quietos (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    this.drivers.forEach((driver) => {
      const travelled = moving ? (driver.start + elapsed * driver.speed) % this.span : driver.start % this.span;
      driver.group.position.x = driver.direction * (travelled - this.span / 2);
    });
    const glow = 0.3 + MathUtils.clamp(night, 0, 1) * 2.2;
    this.lights.forEach((light) => {
      light.emissiveIntensity = glow;
    });
  }
}
