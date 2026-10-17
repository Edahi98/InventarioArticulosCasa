import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SeededRandom } from "./SeededRandom.js";

const STONE = 0xf3dfe9;
const FENCE = 0xfffaf2;
const SHRUB = [0x86d6a8, 0xa6e29a, 0xc2e69a] as const;
const POST = 0x5a3d57;
const FLAG = 0xff4f5b;
const GROUND_TOP = 0.06;
const FENCE_RADIUS = 1.62;
const FENCE_SPAN = 1.15;
const FENCE_GAP = 0.34;

export class YardDetails {
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * @param rng - Azar con semilla.
   */
  constructor(private readonly rng: SeededRandom) {}

  /**
   * Jardín delantero de una casa, en el espacio del lote (+z es el frente): caminito de piedras hasta
   * la banqueta, cerca blanca curva que sigue el borde redondo del jardín con una entrada, buzón con
   * bandera y arbustos junto a la puerta.
   *
   * @param doorX - Posición en x de la puerta, en el espacio del lote.
   * @param doorZ - Posición en z de la puerta, en el espacio del lote.
   * @param accent - Color de la categoría, para el buzón.
   * @returns El jardín.
   */
  build(doorX: number, doorZ: number, accent: number): Group {
    const yard = new Group();
    yard.add(this.path(doorX, doorZ + 0.42, FENCE_RADIUS + 0.5), this.fence(doorX), this.mailbox(doorX, accent), ...this.shrubs(doorX, doorZ));
    return yard;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.75 });
    this.materials.set(color, created);
    return created;
  }

  private path(doorX: number, fromZ: number, toZ: number): Group {
    const path = new Group();
    const stones = Math.max(Math.floor((toZ - fromZ) / 0.36) + 1, 1);
    for (let index = 0; index < stones; index += 1) {
      const stone = new Mesh(new CylinderGeometry(0.13, 0.14, 0.035, 14), this.material(STONE));
      stone.scale.set(1.15, 1, 0.85);
      stone.position.set(doorX + this.rng.between(-0.04, 0.04), GROUND_TOP + 0.014, fromZ + index * 0.36);
      stone.receiveShadow = true;
      path.add(stone);
    }
    return path;
  }

  private fence(doorX: number): Group {
    const fence = new Group();
    const spots: { x: number; z: number; angle: number }[] = [];
    const step = 0.15 / FENCE_RADIUS;
    for (let angle = -FENCE_SPAN; angle <= FENCE_SPAN; angle += step) {
      const x = Math.sin(angle) * FENCE_RADIUS;
      if (Math.abs(x - doorX) > FENCE_GAP) spots.push({ x, z: Math.cos(angle) * FENCE_RADIUS, angle });
    }
    const pickets = new InstancedMesh(new RoundedBoxGeometry(0.06, 0.32, 0.04, 2, 0.02), this.material(FENCE), spots.length);
    const holder = new Object3D();
    spots.forEach((spot, index) => {
      holder.position.set(spot.x, GROUND_TOP + 0.16, spot.z);
      holder.rotation.y = spot.angle;
      holder.updateMatrix();
      pickets.setMatrixAt(index, holder.matrix);
    });
    pickets.instanceMatrix.needsUpdate = true;
    fence.add(pickets);
    [-1, 1].forEach((side) => {
      const arc = spots.filter((spot) => Math.sign(spot.angle) === side);
      if (arc.length < 2) return;
      [0.11, 0.23].forEach((height) => {
        const curve = new CatmullRomCurve3(arc.map((spot) => new Vector3(spot.x, GROUND_TOP + height, spot.z - 0.03)));
        const rail = new Mesh(new TubeGeometry(curve, Math.max(arc.length * 2, 4), 0.014, 6), this.material(FENCE));
        fence.add(rail);
      });
    });
    return fence;
  }

  private mailbox(doorX: number, accent: number): Group {
    const side = doorX > 0 ? -1 : 1;
    const mailbox = new Group();
    const post = new Mesh(new CylinderGeometry(0.024, 0.03, 0.55, 10), this.material(POST));
    post.position.y = 0.275;
    const box = new Mesh(new RoundedBoxGeometry(0.22, 0.16, 0.3, 3, 0.07), this.material(accent));
    box.position.y = 0.63;
    const flag = new Mesh(new RoundedBoxGeometry(0.03, 0.11, 0.07, 2, 0.012), this.material(FLAG));
    flag.position.set(0.12, 0.7, 0.06);
    mailbox.add(post, box, flag);
    const angle = side * (FENCE_SPAN + 0.12);
    mailbox.position.set(Math.sin(angle) * (FENCE_RADIUS + 0.3), GROUND_TOP, Math.cos(angle) * (FENCE_RADIUS + 0.3));
    mailbox.rotation.y = angle;
    mailbox.traverse((part) => {
      part.castShadow = true;
    });
    return mailbox;
  }

  private shrubs(doorX: number, doorZ: number): Mesh[] {
    return [-1, 1]
      .filter(() => this.rng.chance(0.85))
      .map((side) => {
        const shrub = new Mesh(new SphereGeometry(this.rng.between(0.17, 0.25), 14, 10), this.material(this.rng.pick(SHRUB)));
        shrub.position.set(doorX + side * this.rng.between(0.55, 0.75), GROUND_TOP + 0.14, doorZ + 0.14);
        shrub.scale.y = 0.85;
        shrub.castShadow = true;
        return shrub;
      });
  }
}
