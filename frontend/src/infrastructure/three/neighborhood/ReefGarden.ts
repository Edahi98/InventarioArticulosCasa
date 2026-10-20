import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  CORAL_BRAINS,
  CORAL_COLORS,
  CORAL_FANS,
  CORAL_SHELF_Y,
  CORAL_STAGHORNS,
  CORAL_TABLES,
  CORAL_TUBES,
  CORALS_PER_ISLAND,
  CRITTERS_PER_ISLAND,
  KELP_COLORS,
  KELP_PER_ISLAND,
  SEA_FLOOR_Y,
  SEAGRASS_PER_ISLAND,
} from "../../../constantes/barrio_constantes.js";
import { SeaTextures } from "../scenes/SeaTextures.js";
import { StarGeometry } from "../StarGeometry.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

interface Spot {
  x: number;
  y: number;
  z: number;
}

const SWAY = 0.9;
const SHELF_FROM = 1.04;
const SHELF_TO = 1.34;

export class ReefGarden {
  readonly group = new Group();
  private readonly time = { value: 0 };
  private readonly glow: MeshStandardMaterial;
  private readonly swayGlow: MeshStandardMaterial;
  private readonly holder = new Object3D();
  private readonly rng = new SeededRandom("arrecife");

  /**
   * Arrecife de coral alrededor de cada isla como protagonista del mar, todo en mallas instanciadas: una repisa de
   * roca poco profunda pegada a la orilla (bien visible a través del agua) cubierta de corales abanico, cerebro, cuerno
   * de ciervo, tubo y mesa de muchos colores, con textura moteada y un brillo suave de su propio color por la noche;
   * los abanicos, tubos y ramificados se mecen con la corriente. Más hondo hay bosques de kelp y pastos marinos que se
   * mecen, más corales en el fondo y estrellas de mar, erizos y conchas.
   *
   * @param islands - Círculos de las islas.
   */
  constructor(islands: IslandCircle[]) {
    this.glow = ReefGarden.coralMaterial(null);
    this.swayGlow = ReefGarden.coralMaterial(this.time);
    const ring = (perIsland: number, from: number, to: number, shelf = false): Spot[] =>
      islands.flatMap((island) =>
        Array.from({ length: perIsland }, () => {
          const angle = this.rng.between(0, Math.PI * 2);
          const distance = island.radius * this.rng.between(from, to);
          const y = shelf ? CORAL_SHELF_Y + this.rng.between(-0.06, 0.04) : SEA_FLOOR_Y;
          return { x: island.x + Math.cos(angle) * distance, y, z: island.z + Math.sin(angle) * distance };
        }),
      );
    const shelf = (count: number): Spot[] => ring(count, SHELF_FROM, SHELF_TO, true);
    this.group.add(
      ...islands.map((island) => ReefGarden.shelf(island)),
      this.instanced(ReefGarden.fanCoral(), this.swayGlow, shelf(CORAL_FANS), 0.24, 0.4, CORAL_COLORS),
      this.instanced(ReefGarden.brainCoral(), this.glow, shelf(CORAL_BRAINS), 0.22, 0.4, CORAL_COLORS),
      this.instanced(ReefGarden.branchCoral(), this.swayGlow, shelf(CORAL_STAGHORNS), 0.18, 0.28, CORAL_COLORS),
      this.instanced(ReefGarden.tubeCoral(), this.swayGlow, shelf(CORAL_TUBES), 0.3, 0.45, CORAL_COLORS),
      this.instanced(ReefGarden.tableCoral(), this.glow, shelf(CORAL_TABLES), 0.35, 0.6, CORAL_COLORS),
      this.blades(ring(KELP_PER_ISLAND, 1.52, 1.85), 2.2, 3.2, 0.28),
      this.blades(ring(SEAGRASS_PER_ISLAND, 1.5, 1.95), 0.35, 0.8, 0.18),
      this.instanced(ReefGarden.branchCoral(), this.glow, ring(Math.ceil(CORALS_PER_ISLAND / 2), 1.55, 1.9), 0.5, 0.9, CORAL_COLORS),
      this.instanced(ReefGarden.brainCoral(), this.glow, ring(Math.ceil(CORALS_PER_ISLAND / 3), 1.55, 1.9), 0.45, 0.8, CORAL_COLORS),
      this.instanced(ReefGarden.fanCoral(), this.glow, ring(Math.ceil(CORALS_PER_ISLAND / 3), 1.55, 1.85), 0.7, 1.1, CORAL_COLORS),
      this.instanced(ReefGarden.starfish(), this.material(0xff8a3d), shelf(CRITTERS_PER_ISLAND), 0.16, 0.24, [0xff8a3d, 0xff6f91, 0xffd84d]),
      this.instanced(ReefGarden.urchin(), this.material(0x6a4fb8), ring(Math.ceil(CRITTERS_PER_ISLAND / 2), 1.55, 1.9), 0.16, 0.24, [0x6a4fb8, 0x3a2a6a, 0xb04f8a]),
      this.instanced(new SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.material(0xffc8d6), shelf(CRITTERS_PER_ISLAND), 0.1, 0.16, [0xffc8d6, 0xfff1e0, 0xffd9a8]),
    );
    this.update(0, 0, false);
  }

  /**
   * Mece el kelp y el pasto marino y enciende el brillo de los corales de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    this.time.value = moving ? elapsed : 0;
    this.glow.emissiveIntensity = 0.04 + night * 0.65;
    this.swayGlow.emissiveIntensity = 0.04 + night * 0.65;
  }

  private material(color: number): MeshStandardMaterial {
    return new MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, map: SeaTextures.speckle(), emissive: color, emissiveIntensity: 0.02 });
  }

  private blades(spots: Spot[], low: number, high: number, width: number): InstancedMesh {
    const geometry = new PlaneGeometry(width, 1, 1, 8).translate(0, 0.5, 0);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const y = position.getY(index);
      position.setX(index, position.getX(index) * (1 - y * 0.55));
      position.setZ(index, Math.sin(y * 4) * 0.06);
    }
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({ map: SeaTextures.weed(), side: DoubleSide, roughness: 0.6 });
    const time = this.time;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat seed = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;\ntransformed.x += sin(uTime * ${SWAY.toFixed(2)} + seed) * 0.35 * position.y * position.y;\ntransformed.z += cos(uTime * ${(SWAY * 0.8).toFixed(2)} + seed) * 0.2 * position.y * position.y;\n#endif`,
      );
    };
    const mesh = new InstancedMesh(geometry, material, spots.length);
    spots.forEach((spot, index) => {
      this.holder.position.set(spot.x, spot.y, spot.z);
      this.holder.rotation.set(0, this.rng.between(0, Math.PI), 0);
      this.holder.scale.set(1, this.rng.between(low, high), 1);
      this.holder.updateMatrix();
      mesh.setMatrixAt(index, this.holder.matrix);
      mesh.setColorAt(index, new Color(this.rng.pick(KELP_COLORS)));
    });
    return ReefGarden.finish(mesh);
  }

  private instanced(geometry: BufferGeometry, material: MeshStandardMaterial, spots: Spot[], low: number, high: number, colors: readonly number[]): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, spots.length);
    spots.forEach((spot, index) => {
      const size = this.rng.between(low, high);
      this.holder.position.set(spot.x, spot.y, spot.z);
      this.holder.rotation.set(0, this.rng.between(0, Math.PI * 2), 0);
      this.holder.scale.setScalar(size);
      this.holder.updateMatrix();
      mesh.setMatrixAt(index, this.holder.matrix);
      mesh.setColorAt(index, new Color(this.rng.pick(colors)));
    });
    return ReefGarden.finish(mesh);
  }

  private static coralMaterial(time: { value: number } | null): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ roughness: 0.55, map: SeaTextures.speckle(), bumpMap: SeaTextures.speckle(), bumpScale: 0.6, emissive: 0xffffff, emissiveIntensity: 0, side: DoubleSide });
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance *= vColor;\n#endif",
      );
      if (!time) return;
      shader.uniforms.uTime = time;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat seed = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.6;\ntransformed.x += sin(uTime * 1.1 + seed) * 0.06 * position.y * position.y;\ntransformed.z += cos(uTime * 0.9 + seed) * 0.04 * position.y * position.y;\n#endif`,
      );
    };
    return material;
  }

  private static shelf(island: IslandCircle): Mesh {
    const r = island.radius;
    const profile = [
      new Vector2(r * 1.55, SEA_FLOOR_Y),
      new Vector2(r * (SHELF_TO + 0.1), CORAL_SHELF_Y - 0.9),
      new Vector2(r * SHELF_TO, CORAL_SHELF_Y - 0.06),
      new Vector2(r * 1.1, CORAL_SHELF_Y),
      new Vector2(r * 0.97, CORAL_SHELF_Y + 0.45),
    ];
    const geometry = new LatheGeometry(profile, 64);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const bump = 1 + 0.035 * Math.sin(Math.atan2(z, x) * 9 + position.getY(index) * 3);
      position.setXYZ(index, x * bump, position.getY(index), z * bump);
    }
    geometry.computeVertexNormals();
    const shelf = new Mesh(geometry, new MeshStandardMaterial({ color: 0xf0d9c4, map: SeaTextures.rock(), bumpMap: SeaTextures.rock(), bumpScale: 1.2, roughness: 0.95 }));
    shelf.position.set(island.x, 0, island.z);
    shelf.receiveShadow = true;
    return shelf;
  }

  private static tubeCoral(): BufferGeometry {
    const tubes = [
      [0, 0, 1.1],
      [0.28, 0.1, 0.8],
      [-0.25, 0.15, 0.95],
      [0.1, -0.3, 0.7],
      [-0.15, -0.25, 0.6],
    ].map(([x, z, height]) => new CylinderGeometry(0.12, 0.1, height as number, 10, 1, true).translate(x as number, (height as number) / 2, z as number).toNonIndexed());
    return mergeGeometries(tubes) ?? (tubes[0] as BufferGeometry);
  }

  private static tableCoral(): BufferGeometry {
    const plate = new CylinderGeometry(1, 0.85, 0.12, 20, 1).translate(0, 0.75, 0);
    const position = plate.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const bump = 1 + 0.12 * Math.sin(Math.atan2(z, x) * 6);
      position.setXYZ(index, x * bump, position.getY(index), z * bump);
    }
    plate.computeVertexNormals();
    const stalk = new CylinderGeometry(0.12, 0.2, 0.75, 8).translate(0, 0.37, 0);
    return mergeGeometries([plate.toNonIndexed(), stalk.toNonIndexed()]) ?? plate;
  }

  private static finish(mesh: InstancedMesh): InstancedMesh {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  private static branchCoral(): BufferGeometry {
    const parts: BufferGeometry[] = [new CylinderGeometry(0.16, 0.22, 1.2, 8).translate(0, 0.6, 0)];
    [-0.7, -0.25, 0.25, 0.7].forEach((tilt, branch) => {
      const length = 0.9 + (branch % 2) * 0.35;
      const arm = new CylinderGeometry(0.08, 0.12, length, 7).translate(0, length / 2, 0).rotateZ(-tilt).rotateY(branch * 1.4).translate(0, 1.0, 0);
      const tip = new Vector3(0, length, 0).applyAxisAngle(new Vector3(0, 0, 1), -tilt).applyAxisAngle(new Vector3(0, 1, 0), branch * 1.4);
      parts.push(arm, new SphereGeometry(0.13, 8, 6).translate(tip.x, tip.y + 1.0, tip.z));
    });
    return mergeGeometries(parts.map((part) => part.toNonIndexed())) ?? parts[0] as BufferGeometry;
  }

  private static brainCoral(): BufferGeometry {
    const geometry = new IcosahedronGeometry(1, 3);
    const position = geometry.getAttribute("position");
    const vertex = new Vector3();
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index);
      vertex.multiplyScalar(1 + 0.08 * Math.sin(vertex.x * 14) * Math.sin(vertex.z * 14));
      position.setXYZ(index, vertex.x, Math.max(vertex.y, -0.2) * 0.75, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private static fanCoral(): BufferGeometry {
    const fan = new Shape();
    fan.moveTo(0, 0);
    fan.bezierCurveTo(-1.1, 0.4, -1.0, 1.5, 0, 1.6);
    fan.bezierCurveTo(1.0, 1.5, 1.1, 0.4, 0, 0);
    return new ShapeGeometry(fan, 10);
  }

  private static starfish(): BufferGeometry {
    const star = StarGeometry.build();
    star.rotateX(-Math.PI / 2);
    star.scale(1, 0.4, 1);
    star.translate(0, 0.08, 0);
    return star;
  }

  private static urchin(): BufferGeometry {
    const ball = new IcosahedronGeometry(1, 1);
    const spikes: BufferGeometry[] = [new SphereGeometry(0.6, 10, 8).toNonIndexed()];
    const position = ball.getAttribute("position");
    const seen = new Set<string>();
    for (let index = 0; index < position.count; index += 1) {
      const direction = new Vector3().fromBufferAttribute(position, index).normalize();
      const key = direction.toArray().map((value) => value.toFixed(2)).join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      const spike = new ConeGeometry(0.08, 0.9, 5).translate(0, 0.85, 0).rotateX(Math.PI / 2);
      spike.lookAt(direction);
      spikes.push(spike.toNonIndexed());
    }
    const merged = mergeGeometries(spikes) ?? (spikes[0] as BufferGeometry);
    merged.translate(0, 0.5, 0);
    return merged;
  }
}
