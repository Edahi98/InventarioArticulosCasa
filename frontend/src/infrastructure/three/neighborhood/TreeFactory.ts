import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import type { SeededRandom } from "./SeededRandom.js";

const TRUNK = 0x9a6b52;
const FOLIAGE = [0x86d6a8, 0xa6e29a, 0xffb3cf, 0xc2e69a] as const;

export class TreeFactory {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly trunkGeometry = new CylinderGeometry(0.08, 0.15, 0.62, 10);
  private readonly puffGeometry = new SphereGeometry(1, 16, 12);

  /**
   * @param rng - Azar con semilla, para que cada árbol salga igual cada vez.
   */
  constructor(private readonly rng: SeededRandom) {}

  /**
   * Árbol esponjoso: un tronco gordito y una copa hecha de tres bolas que se mecen con el viento.
   *
   * @param x - Posición en x.
   * @param z - Posición en z.
   * @param scale - Tamaño relativo.
   * @param blossom - Si es `true`, la copa es de flor rosa.
   * @returns El árbol.
   */
  build(x: number, z: number, scale: number, blossom = false): Group {
    const tree = new Group();
    const trunk = new Mesh(this.trunkGeometry, this.material(TRUNK));
    trunk.position.y = 0.31;
    trunk.castShadow = true;
    const color = blossom ? FOLIAGE[2] : this.rng.pick([FOLIAGE[0], FOLIAGE[1], FOLIAGE[3], FOLIAGE[2]]);
    const foliage = this.material(color);
    const crown: [number, number, number, number][] = [
      [0, 1.0, 0, 0.58],
      [0.34, 0.86, 0.12, 0.4],
      [-0.3, 1.2, -0.1, 0.42],
    ];
    tree.add(trunk);
    crown.forEach(([cx, cy, cz, radius]) => {
      const puff = new Mesh(this.puffGeometry, foliage);
      puff.position.set(cx, cy, cz);
      puff.scale.setScalar(radius);
      puff.castShadow = true;
      tree.add(puff);
    });
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = this.rng.between(0, Math.PI * 2);
    return tree;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.7 });
    this.materials.set(color, created);
    return created;
  }
}
