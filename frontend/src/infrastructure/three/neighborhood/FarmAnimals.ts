import { CapsuleGeometry, ConeGeometry, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from "three";
import { SurfaceTextures } from "../SurfaceTextures.js";

export type FarmKind = "oveja" | "vaca";

type Vec3 = [number, number, number];

export class FarmAnimals {
  private static readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Animal de granja de juguete que pasta en las lomas, mirando hacia +z: una oveja de lana en bolitas con cara oscura
   * o una vaca blanca con manchas, cuernitos y campana. La cabeza va aparte para que cabecee al comer.
   *
   * @param kind - Oveja o vaca.
   * @returns El animal (patas en y = 0) y su cabeza.
   */
  static build(kind: FarmKind): { group: Group; head: Group } {
    const group = new Group();
    const head = new Group();
    const sheep = kind === "oveja";
    const wool = 0xfffaf2;
    const dark = 0x3a2a40;
    [-1, 1].forEach((side) =>
      [-1, 1].forEach((end) => this.add(group, new CapsuleGeometry(0.05, 0.16, 4, 8), sheep ? dark : wool, [side * 0.12, 0.13, end * 0.18])),
    );
    if (sheep) {
      const puff = new IcosahedronGeometry(0.12, 1);
      for (let index = 0; index < 9; index += 1) {
        const angle = (index / 9) * Math.PI * 2;
        this.add(group, puff, wool, [Math.cos(angle) * 0.12, 0.36 + (index % 2) * 0.06, Math.sin(angle) * 0.2]);
      }
      this.add(group, new SphereGeometry(0.2, 14, 10), wool, [0, 0.38, 0], [1, 0.9, 1.3]);
    }
    if (!sheep) {
      this.add(group, new SphereGeometry(0.22, 16, 12), wool, [0, 0.38, 0], [0.9, 0.85, 1.5]);
      [
        [0.12, 0.45, 0.1],
        [-0.15, 0.36, -0.12],
        [0.05, 0.5, -0.2],
      ].forEach((at) => this.add(group, new SphereGeometry(0.08, 10, 8), dark, at as Vec3, [1, 0.5, 1.2]));
      this.add(group, new SphereGeometry(0.06, 10, 8), 0xff9db1, [0, 0.2, -0.05], [1.2, 0.7, 1]);
      this.add(group, new CapsuleGeometry(0.015, 0.2, 4, 6), wool, [0, 0.4, -0.34]).rotation.x = 0.4;
    }
    head.position.set(0, 0.42, sheep ? 0.3 : 0.36);
    group.add(head);
    this.add(head, new SphereGeometry(sheep ? 0.1 : 0.12, 14, 10), sheep ? dark : wool, [0, 0, 0.04], [0.9, 1, 1.2]);
    if (!sheep) {
      this.add(head, new SphereGeometry(0.08, 12, 8), 0xffc8d6, [0, -0.05, 0.13], [1.2, 0.8, 0.8]);
      [-1, 1].forEach((side) => this.add(head, new ConeGeometry(0.02, 0.08, 6), 0xfff1c4, [side * 0.07, 0.11, 0]).rotation.z = -side * 0.5);
      this.add(head, new SphereGeometry(0.035, 10, 8), 0xffd43b, [0, -0.15, 0.02]);
    }
    if (sheep) this.add(head, new IcosahedronGeometry(0.07, 1), wool, [0, 0.08, 0]);
    [-1, 1].forEach((side) => {
      this.add(head, new SphereGeometry(0.035, 8, 6), sheep ? dark : wool, [side * 0.1, 0.03, -0.01], [1.4, 0.6, 0.9]);
      this.add(head, new SphereGeometry(0.016, 8, 6), sheep ? 0xffffff : dark, [side * 0.045, 0.03, 0.12]);
    });
    group.traverse((part) => {
      part.castShadow = true;
    });
    return { group, head };
  }

  private static add(parent: Group, geometry: BufferGeometry, color: number, at: Vec3, scale: Vec3 = [1, 1, 1]): Mesh {
    const mesh = new Mesh(geometry, this.material(color));
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  private static material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.85, map: SurfaceTextures.fur(), bumpMap: SurfaceTextures.fur(), bumpScale: 0.7 });
    this.materials.set(color, created);
    return created;
  }
}
