import { CapsuleGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import type { ClayMaterials } from "../park/ClayMaterials.js";
import type { Interactive } from "../park/ParkInteraction.js";

const LAP = 16;
const TRAIL = 7;
const SPAN = 34;

export class Rocket {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly ship = new Group();
  private readonly flame: Mesh;
  private readonly puffs: Mesh[] = [];
  private readonly flameMaterial = new MeshStandardMaterial({ color: 0xffe35c, emissive: 0xff9a1a, emissiveIntensity: 1.4 });
  private hitAt = -10;

  /**
   * Cohete de juguete que cruza el cielo de lado a lado dejando una estela de bolitas de humo. Al tocarlo
   * da una vuelta completa.
   *
   * @param clay - Materiales compartidos.
   */
  constructor(clay: ClayMaterials) {
    const body = new Mesh(new CapsuleGeometry(0.5, 1.1, 8, 18), clay.get(0xfff6dc));
    body.rotation.z = -Math.PI / 2;
    const nose = new Mesh(new ConeGeometry(0.5, 0.8, 18), clay.get(0xff6b8f));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 1.45;
    const window = new Mesh(new SphereGeometry(0.22, 14, 10), clay.get(0x7fd0ea));
    window.position.set(0.35, 0.18, 0.43);
    window.scale.z = 0.5;
    this.flame = new Mesh(new ConeGeometry(0.32, 1, 12), this.flameMaterial);
    this.flame.rotation.z = Math.PI / 2;
    this.flame.position.x = -1.45;
    this.ship.add(body, nose, window, this.flame);
    [0, 1, 2].forEach((index) => {
      const fin = new Mesh(new ConeGeometry(0.28, 0.9, 4), clay.get(0xb89cf2));
      const angle = (index / 3) * Math.PI * 2;
      fin.position.set(-0.85, Math.sin(angle) * 0.55, Math.cos(angle) * 0.55);
      fin.rotation.set(angle, 0, Math.PI / 2 + Math.cos(angle) * 0.4);
      this.ship.add(fin);
    });
    this.group.add(this.ship);
    for (let index = 0; index < TRAIL; index += 1) {
      const puff = new Mesh(new SphereGeometry(0.34 - index * 0.025, 10, 8), clay.get(0xffffff));
      this.puffs.push(puff);
      this.group.add(puff);
    }
    this.ship.userData.interactiveId = "cohete";
    this.interactives = [
      {
        id: "cohete",
        object: this.ship,
        hit: (now) => {
          this.hitAt = now;
        },
      },
    ];
  }

  /**
   * Avanza el cohete por su trayectoria y lo hace dar la vuelta si lo tocaron.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` el cohete queda parado en un lugar visible (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const point = (time: number, target: Vector3): Vector3 => {
      const progress = ((time / LAP) % 1 + 1) % 1;
      return target.set(-SPAN / 2 + progress * SPAN, 8.5 + Math.sin(progress * Math.PI * 2) * 1.6, -6);
    };
    const here = point(moving ? elapsed : LAP * 0.78, new Vector3());
    const ahead = point((moving ? elapsed : LAP * 0.78) + 0.1, new Vector3());
    const loop = Math.min((elapsed - this.hitAt) / 1.1, 1);
    this.ship.position.copy(here);
    this.ship.rotation.z = Math.atan2(ahead.y - here.y, ahead.x - here.x) + (1 - Math.pow(1 - loop, 3)) * Math.PI * 2 * (loop < 1 ? 1 : 0);
    this.flame.scale.set(1 + Math.sin(elapsed * 22) * 0.2, 1, 1);
    this.flameMaterial.emissiveIntensity = 1.3 + night * 0.8;
    this.puffs.forEach((puff, index) => {
      point((moving ? elapsed : LAP * 0.78) - 0.22 * (index + 1), puff.position);
      puff.position.x -= 1.9;
      puff.visible = puff.position.x < here.x;
    });
  }
}
