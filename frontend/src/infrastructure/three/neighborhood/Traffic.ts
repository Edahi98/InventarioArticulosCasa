import { Group, MathUtils, MeshStandardMaterial, type Curve, type Vector3 } from "three";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { ToyCar, type CarKind } from "./ToyCar.js";

interface Driver {
  group: Group;
  head: Group;
  bob: number;
  direction: 1 | -1;
  speed: number;
  start: number;
}

const COLORS = [0xff4f8b, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x7fd0a0, 0xffb066] as const;
const KINDS: CarKind[] = ["pickup", "camioneta", "sedan"];
const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];

export class Traffic {
  readonly group = new Group();
  private readonly drivers: Driver[] = [];
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
      const { group, headlights, head } = ToyCar.build(rng.pick(COLORS), KINDS[index % KINDS.length], TONES[index % TONES.length], index);
      this.group.add(group);
      this.lights.push(headlights);
      this.drivers.push({ group, head, bob: rng.between(0, 6), direction: index % 2 === 0 ? 1 : -1, speed: rng.between(0.8, 1.5), start: (index / cars + rng.between(0, 0.05)) % 1 });
    }
  }

  /**
   * Hace avanzar a los coches por su carril, siguiendo la curva de la calle, y enciende los faros de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` los coches quedan quietos (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    this.drivers.forEach((driver) => {
      const progress = driver.start + (moving ? (driver.direction * elapsed * driver.speed) / this.length : 0);
      const { point, tangent, normal } = RoadBuilder.frame(this.curve, progress);
      const lane = driver.direction * -this.roadWidth * 0.22;
      driver.group.position.set(point.x + normal.x * lane, 0.08, point.z + normal.z * lane);
      driver.group.rotation.y = Math.atan2(-tangent.z * driver.direction, tangent.x * driver.direction);
      driver.head.rotation.z = moving ? Math.sin(elapsed * 4 + driver.bob) * 0.1 : 0;
    });
    const glow = 0.3 + MathUtils.clamp(night, 0, 1) * 2.2;
    this.lights.forEach((light) => {
      light.emissiveIntensity = glow;
    });
  }
}
