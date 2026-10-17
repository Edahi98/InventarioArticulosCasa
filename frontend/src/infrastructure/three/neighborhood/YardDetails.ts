import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import { SeededRandom } from "./SeededRandom.js";

const STONE = 0xf3dfe9;
const FENCE = 0xfffaf2;
const SHRUB = [0x7fd0a0, 0x9bdc8a, 0xb7e08a] as const;
const POST = 0x5a3d57;
const FLAG = 0xff4f5b;
const GROUND_TOP = 0.06;
const FENCE_GAP = 0.34;

export class YardDetails {
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * @param rng - Azar con semilla.
   * @param lotWidth - Ancho de cada lote.
   * @param lotDepth - Fondo de cada lote.
   */
  constructor(
    private readonly rng: SeededRandom,
    private readonly lotWidth: number,
    private readonly lotDepth: number,
  ) {}

  /**
   * Jardín delantero de una casa: caminito de piedras hasta la banqueta, cerca blanca con una entrada,
   * buzón con bandera y arbustos junto a la puerta.
   *
   * @param x - Centro del lote.
   * @param z - Centro del lote.
   * @param doorX - Posición en x de la puerta.
   * @param doorZ - Posición en z de la puerta.
   * @param accent - Color de la categoría, para el buzón.
   * @returns El jardín.
   */
  build(x: number, z: number, doorX: number, doorZ: number, accent: number): Group {
    const yard = new Group();
    const fenceZ = z + this.lotDepth / 2 - 0.2;
    yard.add(this.path(doorX, doorZ + 0.42, fenceZ + 0.45), this.fence(x, fenceZ, doorX), this.mailbox(x, fenceZ, doorX, accent), ...this.shrubs(doorX, doorZ));
    return yard;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.85 });
    this.materials.set(color, created);
    return created;
  }

  private path(doorX: number, fromZ: number, toZ: number): Group {
    const path = new Group();
    const stones = Math.max(Math.floor((toZ - fromZ) / 0.36) + 1, 1);
    for (let index = 0; index < stones; index += 1) {
      const stone = new Mesh(new CylinderGeometry(0.13, 0.13, 0.03, 12), this.material(STONE));
      stone.scale.set(1.15, 1, 0.85);
      stone.position.set(doorX + this.rng.between(-0.04, 0.04), GROUND_TOP + 0.012, fromZ + index * 0.36);
      stone.receiveShadow = true;
      path.add(stone);
    }
    return path;
  }

  private fence(x: number, z: number, doorX: number): Group {
    const fence = new Group();
    const half = this.lotWidth / 2 - 0.3;
    const spots: number[] = [];
    for (let px = x - half; px <= x + half; px += 0.15) {
      if (Math.abs(px - doorX) > FENCE_GAP) spots.push(px);
    }
    const pickets = new InstancedMesh(new BoxGeometry(0.05, 0.3, 0.03), this.material(FENCE), spots.length);
    const holder = new Object3D();
    spots.forEach((px, index) => {
      holder.position.set(px, GROUND_TOP + 0.15, z);
      holder.updateMatrix();
      pickets.setMatrixAt(index, holder.matrix);
    });
    pickets.instanceMatrix.needsUpdate = true;
    fence.add(pickets);
    [
      [x - half, doorX - FENCE_GAP],
      [doorX + FENCE_GAP, x + half],
    ].forEach(([from, to]) => {
      if (from === undefined || to === undefined || to - from <= 0.1) return;
      [0.1, 0.22].forEach((height) => {
        const rail = new Mesh(new BoxGeometry(to - from, 0.025, 0.02), this.material(FENCE));
        rail.position.set((from + to) / 2, GROUND_TOP + height, z - 0.025);
        fence.add(rail);
      });
    });
    return fence;
  }

  private mailbox(x: number, fenceZ: number, doorX: number, accent: number): Group {
    const side = doorX > x ? -1 : 1;
    const mailbox = new Group();
    const post = new Mesh(new CylinderGeometry(0.022, 0.026, 0.55, 8), this.material(POST));
    post.position.y = 0.275;
    const box = new Mesh(new BoxGeometry(0.2, 0.14, 0.3), this.material(accent));
    box.position.y = 0.62;
    const flag = new Mesh(new BoxGeometry(0.02, 0.1, 0.06), this.material(FLAG));
    flag.position.set(0.11, 0.68, 0.06);
    mailbox.add(post, box, flag);
    mailbox.position.set(x + side * (this.lotWidth / 2 - 0.5), GROUND_TOP, fenceZ + 0.28);
    mailbox.traverse((part) => {
      part.castShadow = true;
    });
    return mailbox;
  }

  private shrubs(doorX: number, doorZ: number): Mesh[] {
    return [-1, 1]
      .filter(() => this.rng.chance(0.85))
      .map((side) => {
        const shrub = new Mesh(new SphereGeometry(this.rng.between(0.16, 0.24), 10, 8), this.material(this.rng.pick(SHRUB)));
        shrub.position.set(doorX + side * this.rng.between(0.55, 0.75), GROUND_TOP + 0.14, doorZ + 0.12);
        shrub.scale.y = 0.85;
        shrub.castShadow = true;
        return shrub;
      });
  }
}
