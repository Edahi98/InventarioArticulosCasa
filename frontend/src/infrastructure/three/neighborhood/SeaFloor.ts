import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Vector2,
  type CanvasTexture,
} from "three";
import { SEA_FLOOR_Y, SEA_WATER_Y } from "../../../constantes/barrio_constantes.js";
import { SeaTextures } from "../scenes/SeaTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

const ROCK_TINTS = [0xd8dde6, 0xcbc2e2, 0xb9c5d8, 0xe6d5c2] as const;
const RAYS_PER_ISLAND = 3;

export class SeaFloor {
  readonly group = new Group();
  private readonly caustics: CanvasTexture;
  private readonly rayMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, fog: false });
  private readonly causticMaterial: MeshBasicMaterial;

  /**
   * Fondo del mar que se ve a través del agua: arena teñida de azul con cáusticas que se mueven, un arrecife de roca
   * que baja de cada isla hasta el fondo con peñascos alrededor y rayos de luz que entran inclinados cerca de las orillas.
   *
   * @param islands - Círculos de las islas, para poner su arrecife.
   * @param radius - Radio del fondo (debe cubrir todo lo que se ve a través del agua).
   */
  constructor(islands: IslandCircle[], radius: number) {
    const rng = new SeededRandom("fondo-mar");
    const sand = new Mesh(new CircleGeometry(radius, 64), new MeshStandardMaterial({ color: 0xa9d6e6, map: SeaTextures.sand(), bumpMap: SeaTextures.sand(), bumpScale: 1.2, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = SEA_FLOOR_Y;
    sand.receiveShadow = true;
    this.caustics = SeaTextures.caustics().clone();
    this.caustics.repeat.set(radius / 12, radius / 12);
    this.caustics.needsUpdate = true;
    this.causticMaterial = new MeshBasicMaterial({ map: this.caustics, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false, fog: false });
    const light = new Mesh(new CircleGeometry(radius, 64), this.causticMaterial);
    light.rotation.x = -Math.PI / 2;
    light.position.y = SEA_FLOOR_Y + 0.05;
    this.group.add(sand, light, this.boulders(islands, rng), ...islands.map((island) => this.reef(island)), ...this.rays(islands, rng));
    this.update(0, 0, false);
  }

  /**
   * Mueve las cáusticas del fondo y hace respirar los rayos de luz; de noche casi se apagan.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.caustics.offset.set(Math.sin(t * 0.05) * 0.4, t * 0.015);
    this.causticMaterial.opacity = 0.32 * (1 - night * 0.8);
    this.rayMaterial.opacity = (0.06 + Math.sin(t * 0.6) * 0.02) * (1 - night);
  }

  private reef(island: IslandCircle): Mesh {
    const r = island.radius;
    const profile = [
      new Vector2(0, SEA_FLOOR_Y + 0.05),
      new Vector2(r * 1.12, SEA_FLOOR_Y + 0.05),
      new Vector2(r * 0.95, -3.9),
      new Vector2(r * 0.86, -2.8),
      new Vector2(r * 0.98, -1.8),
      new Vector2(r * 0.9, -0.9),
    ];
    const geometry = new LatheGeometry(profile, 48);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const bump = 1 + 0.06 * Math.sin(Math.atan2(z, x) * 7 + position.getY(index) * 2.1);
      position.setXYZ(index, x * bump, position.getY(index), z * bump);
    }
    geometry.computeVertexNormals();
    const reef = new Mesh(geometry, new MeshStandardMaterial({ color: 0xc8bfe0, map: SeaTextures.rock(), bumpMap: SeaTextures.rock(), bumpScale: 1.4, roughness: 0.95 }));
    reef.position.set(island.x, 0, island.z);
    return reef;
  }

  private boulders(islands: IslandCircle[], rng: SeededRandom): InstancedMesh {
    const perIsland = 16;
    const mesh = new InstancedMesh(new IcosahedronGeometry(1, 1), new MeshStandardMaterial({ map: SeaTextures.rock(), bumpMap: SeaTextures.rock(), bumpScale: 1.4, roughness: 0.95, flatShading: true }), islands.length * perIsland);
    const holder = new Object3D();
    islands.forEach((island, islandIndex) => {
      for (let index = 0; index < perIsland; index += 1) {
        const angle = (index / perIsland) * Math.PI * 2 + rng.between(-0.2, 0.2);
        const distance = island.radius * rng.between(1.5, 1.85);
        const size = rng.between(0.5, 1.3);
        holder.position.set(island.x + Math.cos(angle) * distance, SEA_FLOOR_Y + size * 0.4, island.z + Math.sin(angle) * distance);
        holder.rotation.set(rng.between(0, 3), rng.between(0, 3), 0);
        holder.scale.set(size * 1.2, size * 0.8, size);
        holder.updateMatrix();
        mesh.setMatrixAt(islandIndex * perIsland + index, holder.matrix);
        mesh.setColorAt(islandIndex * perIsland + index, new Color(rng.pick(ROCK_TINTS)));
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  private rays(islands: IslandCircle[], rng: SeededRandom): Mesh[] {
    const height = SEA_WATER_Y - SEA_FLOOR_Y;
    return islands.flatMap((island) =>
      Array.from({ length: RAYS_PER_ISLAND }, () => {
        const angle = rng.between(0, Math.PI * 2);
        const distance = island.radius + rng.between(2, 5);
        const ray = new Mesh(new PlaneGeometry(rng.between(1, 2), height * 1.1), this.rayMaterial);
        ray.position.set(island.x + Math.cos(angle) * distance, SEA_FLOOR_Y + height / 2, island.z + Math.sin(angle) * distance);
        ray.rotation.set(0, rng.between(0, Math.PI), 0.3);
        return ray;
      }),
    );
  }
}
