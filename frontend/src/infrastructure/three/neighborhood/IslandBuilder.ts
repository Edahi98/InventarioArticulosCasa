import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  type BufferGeometry,
} from "three";
import { LILY_PADS } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { SeededRandom } from "./SeededRandom.js";
import type { TreeFactory } from "./TreeFactory.js";
import { Solid } from "../walk/Solid.js";

const GRASS = 0xbfe9d5;
const SOIL = 0xb98b73;
const ROCK = 0xcfc3e6;
const POND = 0x8fd3f0;
const RIM = 0.38;

export class IslandBuilder {
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * @param rng - Azar con semilla.
   * @param trees - Fábrica de árboles.
   */
  constructor(
    private readonly rng: SeededRandom,
    private readonly trees: TreeFactory,
  ) {}

  /**
   * La isla: césped de borde redondeado sobre tierra, rodeada de espuma y de un resplandor de agua
   * que se desvanece, con parches de pasto, rocas, árboles en la orilla y una plaza al centro.
   *
   * @param radius - Radio de la isla.
   * @param plaza - Radio libre en el centro, para el árbol grande y el estanque.
   * @param clear - Ángulos de la orilla donde llegan puentes y teleféricos; ahí no se ponen árboles.
   * @returns La isla y los árboles que se mecen.
   */
  build(radius: number, plaza: number, clear: number[] = []): { group: Group; swaying: Group[] } {
    const group = new Group();
    const swaying: Group[] = [];
    const free = (angle: number): boolean => clear.every((spot) => Math.abs(Math.atan2(Math.sin(angle - spot), Math.cos(angle - spot))) > 1.9 / radius);
    group.add(this.water(radius), this.foam(radius), this.soil(radius), this.grass(radius), ...this.patches(radius), ...this.rocks(radius).filter((rock) => free(Math.atan2(rock.position.z, rock.position.x))));
    for (let angle = 0; angle < Math.PI * 2; angle += this.rng.between(0.2, 0.32)) {
      if (!free(angle)) continue;
      const tree = this.trees.build(Math.cos(angle) * (radius - 0.95), Math.sin(angle) * (radius - 0.95), this.rng.between(0.8, 1.25));
      group.add(tree);
      swaying.push(tree);
    }
    this.plaza(plaza).forEach((part) => {
      group.add(part);
      if (part.userData.sways) swaying.push(part as Group);
    });
    return { group, swaying };
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.78, side: DoubleSide, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.35 });
    this.materials.set(color, created);
    return created;
  }

  private static blob(geometry: BufferGeometry): BufferGeometry {
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const theta = Math.atan2(z, x);
      const factor = 1 + 0.035 * Math.sin(3 * theta + 1.1) + 0.025 * Math.sin(5 * theta + 0.4);
      position.setXYZ(index, x * factor, position.getY(index), z * factor);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private grass(radius: number): Mesh {
    const profile: Vector2[] = [new Vector2(0, 0), new Vector2(radius - RIM, 0)];
    for (let step = 1; step <= 6; step += 1) {
      const angle = (step / 6) * (Math.PI / 2);
      profile.push(new Vector2(radius - RIM + RIM * Math.sin(angle), -RIM + RIM * Math.cos(angle)));
    }
    profile.push(new Vector2(radius - 0.02, -0.62));
    const mesh = new Mesh(IslandBuilder.blob(new LatheGeometry(profile, 96)), this.material(GRASS));
    mesh.receiveShadow = true;
    return mesh;
  }

  private soil(radius: number): Mesh {
    const profile = [
      new Vector2(0, -2.1),
      new Vector2(radius * 0.62, -2.05),
      new Vector2(radius * 0.84, -1.55),
      new Vector2(radius * 0.96, -0.95),
      new Vector2(radius - 0.02, -0.55),
      new Vector2(radius - 0.05, -0.3),
    ];
    const mesh = new Mesh(IslandBuilder.blob(new LatheGeometry(profile, 96)), this.material(SOIL));
    mesh.receiveShadow = true;
    return mesh;
  }

  private water(radius: number): Mesh {
    const surface = document.createElement("canvas");
    surface.width = 128;
    surface.height = 128;
    const context = surface.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(143,211,240,0.5)");
      gradient.addColorStop(0.55, "rgba(143,211,240,0.22)");
      gradient.addColorStop(1, "rgba(143,211,240,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    const map = new CanvasTexture(surface);
    map.colorSpace = SRGBColorSpace;
    const mesh = new Mesh(new CircleGeometry(radius * 2.1, 72), new MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.1;
    return mesh;
  }

  private foam(radius: number): Mesh {
    const geometry = new RingGeometry(radius * 1.04, radius * 1.17, 96, 1);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new Mesh(IslandBuilder.blob(geometry), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
    mesh.position.y = -0.9;
    return mesh;
  }

  private patches(radius: number): Mesh[] {
    return Array.from({ length: 18 }, (_, index) => {
      const angle = this.rng.between(0, Math.PI * 2);
      const distance = Math.sqrt(this.rng.next()) * (radius - 1.5);
      const patch = new Mesh(new CylinderGeometry(this.rng.between(0.5, 1.2), 0, 0, 20), this.material(index % 2 === 0 ? 0xd2f2e2 : 0xa9ddc5));
      patch.geometry.dispose();
      patch.geometry = new CylinderGeometry(this.rng.between(0.5, 1.2), 0, 0.012, 24);
      patch.position.set(Math.cos(angle) * distance, 0.008, Math.sin(angle) * distance);
      patch.receiveShadow = true;
      return patch;
    });
  }

  private rocks(radius: number): Mesh[] {
    return Array.from({ length: 9 }, () => {
      const angle = this.rng.between(0, Math.PI * 2);
      const rock = new Mesh(new DodecahedronGeometry(this.rng.between(0.22, 0.45), 1), this.material(ROCK));
      rock.position.set(Math.cos(angle) * (radius - 0.4), 0.1, Math.sin(angle) * (radius - 0.4));
      rock.scale.y = 0.65;
      Solid.mark(rock, { shape: "cylinder", radius: 0.3, height: 0.3, offset: [0, 0.05, 0] });
      rock.castShadow = true;
      return rock;
    });
  }

  private plaza(plaza: number): Group[] {
    if (plaza < 0.9) return [];
    const parts: Group[] = [];
    const pond = new Group();
    const water = new Mesh(new CylinderGeometry(Math.min(plaza * 0.55, 1.15), Math.min(plaza * 0.55, 1.15), 0.05, 40), this.material(POND));
    water.position.y = 0.04;
    water.receiveShadow = true;
    pond.add(water);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.62) {
      const stone = new Mesh(new DodecahedronGeometry(0.13, 1), this.material(ROCK));
      stone.position.set(Math.cos(angle) * Math.min(plaza * 0.55, 1.15) * 1.08, 0.07, Math.sin(angle) * Math.min(plaza * 0.55, 1.15) * 1.08);
      stone.scale.y = 0.7;
      pond.add(stone);
    }
    const reach = Math.min(plaza * 0.55, 1.15);
    for (let index = 0; index < LILY_PADS; index += 1) {
      const angle = this.rng.between(0, Math.PI * 2);
      const distance = Math.sqrt(this.rng.next()) * reach * 0.8;
      const pad = new Mesh(new CylinderGeometry(0.13, 0.13, 0.012, 16, 1, false, 0.3, Math.PI * 1.8), this.material(0x7fc96a));
      pad.position.set(Math.cos(angle) * distance, 0.072, Math.sin(angle) * distance);
      pad.rotation.y = this.rng.between(0, Math.PI * 2);
      pond.add(pad);
      if (index % 3 !== 0) continue;
      const bloom = new Mesh(new SphereGeometry(0.05, 10, 8), this.material(index % 2 === 0 ? 0xff9fc8 : 0xfffaf2));
      bloom.scale.set(1, 0.6, 1);
      bloom.position.set(pad.position.x, 0.09, pad.position.z);
      pond.add(bloom);
    }
    pond.position.set(Math.min(plaza * 0.3, 0.7), 0, Math.min(plaza * 0.2, 0.5));
    const tree = this.trees.build(-Math.min(plaza * 0.35, 0.8), -Math.min(plaza * 0.25, 0.5), Math.min(Math.max(plaza * 0.75, 0.9), 1.9), true);
    tree.userData.sways = true;
    parts.push(pond, tree);
    return parts;
  }
}
