import { CatmullRomCurve3, CylinderGeometry, Group, InstancedMesh, Mesh, Object3D, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Solid } from "../walk/Solid.js";
import { DECK_TOP } from "./ArchBridge.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { WalkableLink } from "./IslandLinks.js";
import { SeededRandom } from "./SeededRandom.js";

export const ROPE_DECK_WIDTH = 1.0;

const SAG = 0.32;
const PLANK_STEP = 0.19;
const SEGMENT = 0.75;

export class RopeBridge {
  /**
   * Puente colgante de cuerdas y tablones: la pasarela se comba un poco al centro, con tablones de madera sueltos y
   * ladeados, dos pasamanos de cuerda por lado con colgantes, y postes gruesos con farolitos en cada punta. Los
   * tablones y las cuerdas son sólidos por tramos, así que se puede cruzar caminando sin caerse.
   *
   * @param from - Punto donde empieza, sobre el suelo de la primera isla.
   * @param to - Punto donde termina, sobre el suelo de la segunda isla.
   * @param seed - Semilla de los tablones.
   * @returns El puente colocado, sus farolitos y el camino que siguen los ositos.
   */
  build(from: Vector3, to: Vector3, seed: string): WalkableLink {
    const rng = new SeededRandom(seed);
    const group = new Group();
    const span = Math.hypot(to.x - from.x, to.z - from.z);
    const deck = (x: number): number => DECK_TOP - SAG * (1 - (2 * x / span) ** 2);
    const lamps = [CraftMaterials.lantern(), CraftMaterials.lantern()];
    group.add(this.planks(span, deck, rng), ...this.ropes(span, deck), ...this.posts(span, lamps), ...this.colliders(span, deck));
    group.position.set((from.x + to.x) / 2, 0, (from.z + to.z) / 2);
    group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
    const path = (u: number): Vector3 => {
      const x = -span / 2 + u * span;
      return new Vector3(from.x + (to.x - from.x) * u, deck(x), from.z + (to.z - from.z) * u);
    };
    return { group, lamps, path };
  }

  private planks(span: number, deck: (x: number) => number, rng: SeededRandom): InstancedMesh {
    const count = Math.floor(span / PLANK_STEP);
    const mesh = new InstancedMesh(new RoundedBoxGeometry(0.15, 0.045, ROPE_DECK_WIDTH, 2, 0.015), CraftMaterials.wood(0xb98060), count);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      const x = -span / 2 + (index + 0.5) * PLANK_STEP;
      const slope = (deck(x + 0.01) - deck(x - 0.01)) / 0.02;
      holder.position.set(x, deck(x) - 0.025, rng.between(-0.03, 0.03));
      holder.rotation.set(rng.between(-0.04, 0.04), rng.between(-0.08, 0.08), Math.atan(slope));
      holder.scale.set(1, 1, rng.between(0.9, 1.05));
      holder.updateMatrix();
      mesh.setMatrixAt(index, holder.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private ropes(span: number, deck: (x: number) => number): Object3D[] {
    const items: Object3D[] = [];
    const half = ROPE_DECK_WIDTH / 2 + 0.06;
    [-1, 1].forEach((side) => {
      [0.32, 0.62].forEach((height) => {
        const points = Array.from({ length: 13 }, (_, index) => {
          const x = -span / 2 + (index / 12) * span;
          return new Vector3(x, deck(x) + height + (height > 0.5 ? 0.1 * (1 - (2 * x / span) ** 2) : 0), side * half);
        });
        items.push(new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 48, 0.025, 6), CraftMaterials.rope()));
      });
    });
    const hangers = Math.floor(span / 0.45);
    const mesh = new InstancedMesh(new CylinderGeometry(0.012, 0.012, 1, 5), CraftMaterials.rope(), hangers * 2);
    const holder = new Object3D();
    for (let index = 0; index < hangers; index += 1) {
      const x = -span / 2 + (index + 0.5) * (span / hangers);
      [-1, 1].forEach((side, sideIndex) => {
        holder.position.set(x, deck(x) + 0.36, side * half);
        holder.scale.set(1, 0.68, 1);
        holder.updateMatrix();
        mesh.setMatrixAt(index * 2 + sideIndex, holder.matrix);
      });
    }
    mesh.instanceMatrix.needsUpdate = true;
    items.push(mesh);
    return items;
  }

  private posts(span: number, lamps: ReturnType<typeof CraftMaterials.lantern>[]): Group[] {
    return [-1, 1].flatMap((end, endIndex) =>
      [-1, 1].map((side) => {
        const post = new Group();
        const trunk = new Mesh(new CylinderGeometry(0.09, 0.11, 1.0, 10), CraftMaterials.wood(0x9a6b52));
        trunk.position.y = 0.5;
        const knob = new Mesh(new SphereGeometry(0.11, 12, 10), CraftMaterials.paint(0xff8fb7));
        knob.position.y = 1.05;
        post.add(trunk, knob);
        if (side > 0) {
          const lamp = new Mesh(new SphereGeometry(0.08, 12, 10), lamps[endIndex]);
          lamp.position.set(0, 0.85, 0.13);
          post.add(lamp);
        }
        post.position.set(end * (span / 2 - 0.1), DECK_TOP, side * (ROPE_DECK_WIDTH / 2 + 0.12));
        Solid.mark(post, { shape: "cylinder", radius: 0.11, height: 1, offset: [0, 0.5, 0] });
        post.traverse((part) => {
          part.castShadow = true;
        });
        return post;
      }),
    );
  }

  private colliders(span: number, deck: (x: number) => number): Object3D[] {
    const segments = Math.ceil(span / SEGMENT);
    const items: Object3D[] = [];
    for (let index = 0; index < segments; index += 1) {
      const x0 = -span / 2 + (index / segments) * span;
      const x1 = -span / 2 + ((index + 1) / segments) * span;
      const length = Math.hypot(x1 - x0, deck(x1) - deck(x0)) + 0.04;
      const angle = Math.atan2(deck(x1) - deck(x0), x1 - x0);
      const floor = Solid.mark(new Object3D(), { shape: "box", size: [length, 0.3, ROPE_DECK_WIDTH + 0.2], offset: [0, -0.15, 0] });
      floor.position.set((x0 + x1) / 2, (deck(x0) + deck(x1)) / 2, 0);
      floor.rotation.z = angle;
      items.push(floor);
      [-1, 1].forEach((side) => {
        const wall = Solid.mark(new Object3D(), { shape: "box", size: [length, 0.9, 0.08], offset: [0, 0.45, 0] });
        wall.position.set((x0 + x1) / 2, (deck(x0) + deck(x1)) / 2, side * (ROPE_DECK_WIDTH / 2 + 0.08));
        wall.rotation.z = angle;
        items.push(wall);
      });
    }
    return items;
  }
}
