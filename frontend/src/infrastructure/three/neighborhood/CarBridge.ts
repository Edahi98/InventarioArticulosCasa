import { CylinderGeometry, Group, InstancedMesh, LineCurve3, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CAR_DECK_WIDTH, ROAD_LANE_WIDTH } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import { DECK_TOP } from "./ArchBridge.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { WalkableLink } from "./IslandLinks.js";
import type { NightLights } from "./NightLights.js";
import { StonePath } from "./StonePath.js";

const WATER = -1.4;
const LAMP_STEP = 3.2;

export class CarBridge {
  private static readonly stone = new MeshStandardMaterial({ color: 0xe9dccf, roughness: 0.85, map: SurfaceTextures.rock(), bumpMap: SurfaceTextures.rock(), bumpScale: 1 });

  /**
   * Puente rígido y ancho para carros entre dos islas: calzada de losas de colores con un carril por sentido y
   * banquetas a los lados, de piedra sobre arcos (o de madera sobre caballetes con barandal de cruces), pretiles
   * sólidos, faroles con halo cada pocos pasos y una guirnalda de foquitos a lo largo del barandal. La calzada y los
   * pretiles son sólidos: se puede cruzar caminando o manejando.
   *
   * @param from - Punto donde empieza, sobre el suelo de la primera isla.
   * @param to - Punto donde termina, sobre el suelo de la segunda isla.
   * @param wood - Si es de madera en vez de piedra.
   * @param lights - Luces de la noche, para los halos y la guirnalda.
   * @param seed - Semilla de las losas.
   * @returns El puente colocado, sus faroles y el camino de los peatones (por la banqueta).
   */
  build(from: Vector3, to: Vector3, wood: boolean, lights: NightLights, seed: string): WalkableLink {
    const group = new Group();
    const span = Math.hypot(to.x - from.x, to.z - from.z);
    const lamps: MeshStandardMaterial[] = [];
    const deckMaterial = wood ? CraftMaterials.wood(0xb98060) : CarBridge.stone;
    const slab = new Mesh(new RoundedBoxGeometry(span, 0.24, CAR_DECK_WIDTH, 3, 0.08), deckMaterial);
    slab.position.y = DECK_TOP - 0.12;
    slab.receiveShadow = true;
    Solid.mark(slab, { shape: "box", size: [span, 0.5, CAR_DECK_WIDTH + 0.1], offset: [0, -0.13, 0] });
    const road = new StonePath(seed).build(new LineCurve3(new Vector3(-span / 2, 0, 0), new Vector3(span / 2, 0, 0)), ROAD_LANE_WIDTH);
    road.position.y = DECK_TOP - 0.066;
    group.add(slab, road, ...this.parapets(span, wood), ...this.supports(span, wood), ...this.lampPosts(span, lamps, lights));
    const garland = lights.garland(
      [-1, 1].flatMap((side) =>
        Array.from({ length: Math.floor(span / 0.35) }, (_, index) => {
          const x = -span / 2 + (index + 0.5) * 0.35;
          return new Vector3(x, DECK_TOP + 0.62 + 0.06 * Math.sin((index * Math.PI) / 3), side * (CAR_DECK_WIDTH / 2 - 0.05));
        }),
      ),
    );
    group.add(garland);
    group.position.set((from.x + to.x) / 2, 0, (from.z + to.z) / 2);
    group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
    const side = new Vector3(-(to.z - from.z), 0, to.x - from.x).normalize().multiplyScalar(CAR_DECK_WIDTH / 2 - 0.35);
    const path = (u: number): Vector3 => new Vector3(from.x + (to.x - from.x) * u + side.x, DECK_TOP, from.z + (to.z - from.z) * u + side.z);
    return { group, lamps, path };
  }

  private parapets(span: number, wood: boolean): Object3D[] {
    return [-1, 1].flatMap((side) => {
      const z = side * (CAR_DECK_WIDTH / 2 - 0.05);
      const wall = Solid.mark(new Object3D(), { shape: "box", size: [span, 0.9, 0.14], offset: [0, 0.45, 0] });
      wall.position.set(0, DECK_TOP, z);
      if (!wood) {
        const parapet = new Mesh(new RoundedBoxGeometry(span, 0.34, 0.16, 2, 0.05), CarBridge.stone);
        parapet.position.set(0, DECK_TOP + 0.17, z);
        const cap = new Mesh(new RoundedBoxGeometry(span + 0.04, 0.06, 0.22, 2, 0.025), CraftMaterials.paint(0xff9fc8));
        cap.position.set(0, DECK_TOP + 0.37, z);
        return [parapet, cap, wall];
      }
      const rail = new Mesh(new RoundedBoxGeometry(span, 0.07, 0.08, 2, 0.03), CraftMaterials.wood(0x9a6b52));
      rail.position.set(0, DECK_TOP + 0.5, z);
      const crosses = Math.floor(span / 0.6);
      const braces = new InstancedMesh(new RoundedBoxGeometry(0.05, 0.62, 0.05, 2, 0.02), CraftMaterials.wood(0xc4805a), crosses * 2);
      const holder = new Object3D();
      for (let index = 0; index < crosses; index += 1) {
        [-0.6, 0.6].forEach((tilt, item) => {
          holder.position.set(-span / 2 + (index + 0.5) * (span / crosses), DECK_TOP + 0.26, z);
          holder.rotation.set(0, 0, tilt);
          holder.updateMatrix();
          braces.setMatrixAt(index * 2 + item, holder.matrix);
        });
      }
      braces.instanceMatrix.needsUpdate = true;
      return [rail, braces, wall];
    });
  }

  private supports(span: number, wood: boolean): Mesh[] {
    const count = Math.max(Math.round(span / 3.5), 2);
    if (wood) {
      return Array.from({ length: count - 1 }, (_, index) => -span / 2 + ((index + 1) / count) * span).flatMap((x) =>
        [-1, 1].map((side) => {
          const pile = new Mesh(new CylinderGeometry(0.14, 0.17, DECK_TOP - WATER, 10), CraftMaterials.wood(0x8a5a42));
          pile.position.set(x, (DECK_TOP + WATER) / 2 - 0.12, side * (CAR_DECK_WIDTH / 2 - 0.35));
          return pile;
        }),
      );
    }
    return Array.from({ length: count }, (_, index) => {
      const arch = new Mesh(new TorusGeometry(span / count / 2 - 0.1, 0.22, 10, 24, Math.PI), CarBridge.stone);
      arch.position.set(-span / 2 + (index + 0.5) * (span / count), DECK_TOP - 0.24, 0);
      arch.rotation.x = Math.PI;
      arch.scale.set(1, 0.8, CAR_DECK_WIDTH * 2.3);
      return arch;
    });
  }

  private lampPosts(span: number, lamps: MeshStandardMaterial[], lights: NightLights): Group[] {
    const count = Math.max(Math.floor(span / LAMP_STEP), 1);
    return Array.from({ length: count }, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      const post = new Group();
      const pole = new Mesh(new CylinderGeometry(0.035, 0.05, 1.2, 8), CraftMaterials.paint(0x6b4a6a));
      pole.position.y = 0.6;
      const glass = CraftMaterials.lantern();
      lamps.push(glass);
      const bulb = new Mesh(new SphereGeometry(0.11, 12, 10), glass);
      bulb.position.y = 1.25;
      const halo = lights.halo(1.1);
      halo.position.y = 1.25;
      post.add(pole, bulb, halo);
      post.position.set(-span / 2 + (index + 0.5) * (span / count), DECK_TOP + 0.1, side * (CAR_DECK_WIDTH / 2 - 0.05));
      return post;
    });
  }
}
