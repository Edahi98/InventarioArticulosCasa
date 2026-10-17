import { ConeGeometry, CylinderGeometry, DodecahedronGeometry, Group, Mesh, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import type { TreeFactory } from "../neighborhood/TreeFactory.js";
import type { ClayMaterials } from "../park/ClayMaterials.js";
import type { Interactive } from "../park/ParkInteraction.js";

export class FloatingIsland {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly body = new Group();
  private readonly pebbles: Mesh[] = [];
  private readonly flag: Mesh;
  private readonly guard: GuardianBear;
  private hitAt = -10;

  /**
   * Isla flotante con un castillo de juguete de torres redondas, un árbol, una banderita al viento y un osito
   * guardia que saluda. Debajo, unas piedritas giran en órbita. Al tocarla rebota y el guardia saluda.
   *
   * @param bears - Constructor de ositos compartido.
   * @param trees - Fábrica de árboles compartida.
   * @param clay - Materiales compartidos.
   */
  constructor(bears: BearBuilder, trees: TreeFactory, clay: ClayMaterials) {
    const rng = new SeededRandom("isla");
    const rock = new Mesh(new ConeGeometry(3.3, 4.4, 9, 1), clay.get(0xb59a86));
    rock.rotation.x = Math.PI;
    rock.position.y = -2.4;
    const grass = new Mesh(new CylinderGeometry(3.5, 3.3, 0.55, 32), clay.get(0x9bdc9f));
    const rim = new Mesh(new CylinderGeometry(3.52, 3.52, 0.12, 32), clay.get(0x7cc88a));
    rim.position.y = -0.22;
    this.body.add(rock, grass, rim);

    const keep = new Mesh(new CylinderGeometry(0.9, 1, 2.2, 20), clay.get(0xfff0d6));
    keep.position.set(-0.4, 1.4, -0.4);
    const keepRoof = new Mesh(new ConeGeometry(1.15, 1.2, 20), clay.get(0xff6b8f));
    keepRoof.position.set(-0.4, 3.1, -0.4);
    const towerA = new Mesh(new CylinderGeometry(0.5, 0.55, 1.5, 16), clay.get(0xffd9c7));
    towerA.position.set(-1.7, 1.05, 0.3);
    const roofA = new Mesh(new ConeGeometry(0.68, 0.9, 16), clay.get(0xb89cf2));
    roofA.position.set(-1.7, 2.2, 0.3);
    const towerB = new Mesh(new CylinderGeometry(0.45, 0.5, 1.2, 16), clay.get(0xffd9c7));
    towerB.position.set(0.9, 0.9, 0.5);
    const roofB = new Mesh(new ConeGeometry(0.6, 0.8, 16), clay.get(0x7fd0ea));
    roofB.position.set(0.9, 1.9, 0.5);
    const gate = new Mesh(new RoundedBoxGeometry(0.5, 0.8, 0.2, 3, 0.1), clay.get(0xc4805a));
    gate.position.set(-0.4, 0.55, 0.62);
    const pole = new Mesh(new CylinderGeometry(0.03, 0.03, 0.9, 6), clay.get(0x6b4a6a));
    pole.position.set(-0.4, 4.2, -0.4);
    this.flag = new Mesh(new RoundedBoxGeometry(0.55, 0.32, 0.04, 2, 0.02), clay.get(0xffe35c));
    this.flag.position.set(-0.12, 4.4, -0.4);
    this.body.add(keep, keepRoof, towerA, roofA, towerB, roofB, gate, pole, this.flag);

    const tree = trees.build(1.9, -1.4, 0.9);
    const bush = new Mesh(new SphereGeometry(0.4, 12, 10), clay.get(0x7cc88a));
    bush.position.set(0.3, 0.45, 1.5);
    this.body.add(tree, bush);

    this.guard = new GuardianBear(bears, 1, 0.4, false);
    this.guard.group.position.set(-0.5, 0.28, 1.9);
    this.body.add(this.guard.group);

    for (let index = 0; index < 5; index += 1) {
      const pebble = new Mesh(new DodecahedronGeometry(rng.between(0.2, 0.4), 1), clay.get(0xb59a86));
      pebble.userData.angle = (index / 5) * Math.PI * 2;
      pebble.userData.radius = rng.between(1.5, 2.6);
      pebble.userData.depth = rng.between(-5.6, -4.2);
      this.pebbles.push(pebble);
      this.body.add(pebble);
    }

    this.group.add(this.body);
    this.group.userData.interactiveId = "isla";
    this.interactives = [
      {
        id: "isla",
        object: this.group,
        hit: (now) => {
          this.hitAt = now;
          this.guard.poke(now);
        },
      },
    ];
  }

  /**
   * Hace flotar la isla, ondear la bandera, orbitar las piedritas y animar al guardia.
   *
   * @param elapsed - Segundos transcurridos.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const bounce = Math.max(0, 1 - (elapsed - this.hitAt) / 0.9);
    const base = this.group.userData.baseY as number;
    this.group.position.y = base + Math.sin(t * 0.6) * 0.5 + Math.abs(Math.sin(bounce * Math.PI * 3)) * bounce * 0.9;
    this.body.rotation.y = Math.sin(t * 0.25) * 0.15;
    this.body.rotation.z = Math.sin(t * 0.5) * 0.025;
    this.flag.rotation.y = Math.sin(t * 3.2) * 0.35;
    this.pebbles.forEach((pebble) => {
      const { angle, radius, depth } = pebble.userData as { angle: number; radius: number; depth: number };
      const turn = angle + t * 0.5;
      pebble.position.set(Math.cos(turn) * radius, depth + Math.sin(t + angle) * 0.2, Math.sin(turn) * radius);
      pebble.rotation.set(t * 0.4 + angle, t * 0.3, 0);
    });
    this.guard.update(elapsed, 0, moving);
  }

  /**
   * Coloca la isla y recuerda su altura de reposo.
   *
   * @param x - Posición horizontal.
   * @param y - Altura de reposo.
   * @param z - Profundidad.
   * @param scale - Tamaño.
   */
  place(x: number, y: number, z: number, scale: number): void {
    this.group.position.set(x, y, z);
    this.group.userData.baseY = y;
    this.group.scale.setScalar(scale);
  }
}
