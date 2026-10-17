import { CircleGeometry, Color, CylinderGeometry, DodecahedronGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import type { TreeFactory } from "../neighborhood/TreeFactory.js";
import type { ClayMaterials } from "./ClayMaterials.js";

export const POND = { x: -2.5, z: 8.6, radius: 2.7 };
export const PARK_CENTER = { x: 9.5, z: 2.5 };

const HILLS = [0xa9ddc5, 0xcfc3e6, 0xffd9c7, 0xc7e3b2, 0xb7d2f0] as const;
const BLOOMS = [0xff8fb7, 0xffe35c, 0xffffff, 0xb89cf2, 0xffb066] as const;

export class ParkScenery {
  readonly group = new Group();
  private readonly swaying: Group[] = [];
  private readonly rng = new SeededRandom("parque");

  /**
   * Escenario del parque: pradera con una pista de arena bajo el tren, colinas lejanas con árboles, un
   * estanque con piedras, una cerca blanca al frente, flores y árboles esponjosos que se mecen.
   *
   * @param trees - Fábrica de árboles compartida.
   * @param clay - Materiales compartidos.
   */
  constructor(
    private readonly trees: TreeFactory,
    private readonly clay: ClayMaterials,
  ) {
    this.group.add(this.meadow(), this.plaza(), ...this.hills(), this.pond(), this.fence(), this.flowers(), ...this.forest());
  }

  /**
   * Mece los árboles con el viento.
   *
   * @param elapsed - Segundos transcurridos.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.swaying.forEach((tree, index) => {
      tree.rotation.z = Math.sin(t * 1.1 + index) * 0.025;
    });
  }

  private meadow(): Mesh {
    const meadow = new Mesh(new CircleGeometry(170, 72), this.clay.get(0xbfe9d5));
    meadow.rotation.x = -Math.PI / 2;
    meadow.receiveShadow = true;
    return meadow;
  }

  private plaza(): Mesh {
    const plaza = new Mesh(new CylinderGeometry(15.5, 15.5, 0.08, 56), this.clay.get(0xfff0d6));
    plaza.scale.z = 0.52;
    plaza.position.set(PARK_CENTER.x, 0.04, PARK_CENTER.z);
    plaza.receiveShadow = true;
    return plaza;
  }

  private hills(): Group[] {
    return Array.from({ length: 12 }, (_, index) => {
      const hill = new Group();
      const width = this.rng.between(12, 26);
      const dome = new Mesh(new SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.clay.get(HILLS[index % HILLS.length] as number));
      dome.scale.set(width, this.rng.between(4, 10), width * 0.8);
      hill.add(dome);
      hill.position.set(-70 + (index / 12) * 170 + this.rng.between(-6, 6), 0, -this.rng.between(42, 90));
      return hill;
    });
  }

  private pond(): Group {
    const pond = new Group();
    const water = new Mesh(new CylinderGeometry(POND.radius, POND.radius, 0.06, 40), this.clay.get(0x8fd3f0));
    water.position.y = 0.05;
    pond.add(water);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const stone = new Mesh(new DodecahedronGeometry(0.2, 1), this.clay.get(0xcfc3e6));
      stone.position.set(Math.cos(angle) * POND.radius * 1.05, 0.1, Math.sin(angle) * POND.radius * 1.05);
      stone.scale.y = 0.7;
      pond.add(stone);
    }
    pond.position.set(POND.x, 0, POND.z);
    return pond;
  }

  private fence(): Group {
    const fence = new Group();
    const spots: number[] = [];
    for (let x = -12; x <= 33; x += 0.4) spots.push(x);
    const pickets = new InstancedMesh(new RoundedBoxGeometry(0.1, 0.8, 0.07, 2, 0.03), this.clay.get(0xfffaf2), spots.length);
    const holder = new Object3D();
    spots.forEach((x, index) => {
      holder.position.set(x, 0.4, 13.4);
      holder.updateMatrix();
      pickets.setMatrixAt(index, holder.matrix);
    });
    pickets.instanceMatrix.needsUpdate = true;
    pickets.castShadow = true;
    fence.add(pickets);
    [0.25, 0.58].forEach((y) => {
      const rail = new Mesh(new RoundedBoxGeometry(45.4, 0.07, 0.06, 2, 0.02), this.clay.get(0xfffaf2));
      rail.position.set(10.5, y, 13.33);
      fence.add(rail);
    });
    return fence;
  }

  private flowers(): InstancedMesh {
    const count = 110;
    const blooms = new InstancedMesh(new SphereGeometry(0.16, 8, 6), new MeshStandardMaterial({ roughness: 0.7 }), count);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      holder.position.set(this.rng.between(-11, 32), this.rng.between(0.2, 0.45), this.rng.between(10.2, 12.8));
      holder.scale.setScalar(this.rng.between(0.7, 1.3));
      holder.updateMatrix();
      blooms.setMatrixAt(index, holder.matrix);
      blooms.setColorAt(index, new Color(this.rng.pick(BLOOMS)));
    }
    blooms.instanceMatrix.needsUpdate = true;
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;
    return blooms;
  }

  private forest(): Group[] {
    const spots: [number, number, number][] = [];
    for (let index = 0; index < 8; index += 1) spots.push([-36 + this.rng.between(0, 16), -this.rng.between(-6, 24), this.rng.between(1.3, 2.3)]);
    for (let index = 0; index < 14; index += 1) spots.push([4 + this.rng.between(0, 40), -this.rng.between(18, 34), this.rng.between(1.6, 2.6)]);
    for (let index = 0; index < 8; index += 1) spots.push([26 + this.rng.between(0, 12), -this.rng.between(-4, 14), this.rng.between(1.4, 2.2)]);
    return spots.map(([x, z, scale]) => {
      const tree = this.trees.build(x, z, scale, this.rng.chance(0.25));
      this.swaying.push(tree);
      return tree;
    });
  }
}
