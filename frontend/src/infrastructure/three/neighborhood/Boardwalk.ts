import { CylinderGeometry, Group, InstancedMesh, Mesh, Object3D, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Solid } from "../walk/Solid.js";
import { DECK_TOP } from "./ArchBridge.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { WalkableLink } from "./IslandLinks.js";

export const BOARD_DECK_WIDTH = 1.3;

const WATER = -1.4;
const PLANK_STEP = 0.17;
const POST_STEP = 0.9;

export class Boardwalk {
  /**
   * Pasarela de madera sobre pilotes: tablas atravesadas sobre dos largueros, pilotes gruesos que se hunden en el
   * agua con un aro de cuerda, barandal de postes con pasamanos redondo, y farolitos colgados a ratos. La cubierta y
   * los barandales son sólidos para cruzar caminando.
   *
   * @param from - Punto donde empieza, sobre el suelo de la primera isla.
   * @param to - Punto donde termina, sobre el suelo de la segunda isla.
   * @returns La pasarela colocada, sus farolitos y el camino que siguen los ositos.
   */
  build(from: Vector3, to: Vector3): WalkableLink {
    const group = new Group();
    const span = Math.hypot(to.x - from.x, to.z - from.z);
    const lamps = [CraftMaterials.lantern()];
    group.add(this.deck(span), ...this.rails(span, lamps), this.pilings(span));
    group.position.set((from.x + to.x) / 2, 0, (from.z + to.z) / 2);
    group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
    const path = (u: number): Vector3 => new Vector3(from.x + (to.x - from.x) * u, DECK_TOP, from.z + (to.z - from.z) * u);
    return { group, lamps, path };
  }

  private deck(span: number): Group {
    const deck = new Group();
    const count = Math.floor(span / PLANK_STEP);
    const planks = new InstancedMesh(new RoundedBoxGeometry(0.15, 0.05, BOARD_DECK_WIDTH, 2, 0.015), CraftMaterials.wood(0xd29a6a), count);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      holder.position.set(-span / 2 + (index + 0.5) * PLANK_STEP, DECK_TOP - 0.025, 0);
      holder.rotation.set(0, (index % 3) * 0.015 - 0.015, 0);
      holder.updateMatrix();
      planks.setMatrixAt(index, holder.matrix);
    }
    planks.instanceMatrix.needsUpdate = true;
    planks.castShadow = true;
    planks.receiveShadow = true;
    [-1, 1].forEach((side) => {
      const beam = new Mesh(new RoundedBoxGeometry(span, 0.12, 0.12, 2, 0.04), CraftMaterials.wood(0x9a6b52));
      beam.position.set(0, DECK_TOP - 0.11, side * (BOARD_DECK_WIDTH / 2 - 0.12));
      deck.add(beam);
    });
    const floor = Solid.mark(new Object3D(), { shape: "box", size: [span, 0.4, BOARD_DECK_WIDTH + 0.1], offset: [0, -0.2, 0] });
    floor.position.y = DECK_TOP;
    deck.add(planks, floor);
    return deck;
  }

  private rails(span: number, lamps: ReturnType<typeof CraftMaterials.lantern>[]): Object3D[] {
    const items: Object3D[] = [];
    const posts = Math.floor(span / POST_STEP) + 1;
    const mesh = new InstancedMesh(new CylinderGeometry(0.045, 0.05, 0.6, 8), CraftMaterials.wood(0x9a6b52), posts * 2);
    const holder = new Object3D();
    [-1, 1].forEach((side, sideIndex) => {
      for (let index = 0; index < posts; index += 1) {
        holder.position.set(-span / 2 + (index / (posts - 1)) * span, DECK_TOP + 0.3, side * (BOARD_DECK_WIDTH / 2 + 0.02));
        holder.updateMatrix();
        mesh.setMatrixAt(sideIndex * posts + index, holder.matrix);
      }
      const rail = new Mesh(new CylinderGeometry(0.035, 0.035, span, 8), CraftMaterials.wood(0xc4805a));
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, DECK_TOP + 0.6, side * (BOARD_DECK_WIDTH / 2 + 0.02));
      const wall = Solid.mark(new Object3D(), { shape: "box", size: [span, 0.9, 0.1], offset: [0, 0.45, 0] });
      wall.position.set(0, DECK_TOP, side * (BOARD_DECK_WIDTH / 2 + 0.04));
      items.push(rail, wall);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    items.push(mesh);
    const hook = new Group();
    const arm = new Mesh(new RoundedBoxGeometry(0.04, 0.04, 0.3, 2, 0.015), CraftMaterials.wood(0x9a6b52));
    arm.position.set(0, 0.62, -0.15);
    const glass = new Mesh(new SphereGeometry(0.08, 12, 10), lamps[0]);
    glass.position.set(0, 0.5, -0.28);
    hook.add(arm, glass);
    hook.position.set(0, DECK_TOP, BOARD_DECK_WIDTH / 2 + 0.02);
    hook.rotation.y = Math.PI;
    items.push(hook);
    return items;
  }

  private pilings(span: number): InstancedMesh {
    const count = Math.max(Math.floor(span / 1.8) - 1, 1);
    const height = DECK_TOP - WATER;
    const mesh = new InstancedMesh(new CylinderGeometry(0.11, 0.13, height, 10), CraftMaterials.wood(0x8a5a42), count * 2);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      [-1, 1].forEach((side, sideIndex) => {
        holder.position.set(-span / 2 + ((index + 1) / (count + 1)) * span, (DECK_TOP + WATER) / 2 - 0.1, side * (BOARD_DECK_WIDTH / 2 - 0.12));
        holder.updateMatrix();
        mesh.setMatrixAt(index * 2 + sideIndex, holder.matrix);
      });
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }
}
