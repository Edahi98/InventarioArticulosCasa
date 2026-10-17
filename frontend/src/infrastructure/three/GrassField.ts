import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import { SeededRandom } from "./neighborhood/SeededRandom.js";
import { SurfaceTextures } from "./SurfaceTextures.js";

export interface GrassFieldOptions {
  seed: string;
  radius: number;
  y?: number;
  scale?: number;
  density?: number;
  center?: [number, number];
  accept?: (x: number, z: number) => boolean;
}

interface Spot {
  x: number;
  z: number;
}

const GREENS = [0x6fbf5a, 0x86d06a, 0x5fb87a, 0x9be26b, 0xb5e26b] as const;
const BLOOMS = [0xff8fb7, 0xffe35c, 0xffffff, 0xb89cf2, 0xff9f6b, 0x7fd0ea] as const;
const STONES = [0xc9ced8, 0xb3a9c4, 0xd3c3a8] as const;
const CAPS = [0xff6b6b, 0xffb066, 0xff9bb5] as const;
const TUFT_BLADES = 6;
const SWAY_SPEED = 1.6;
const SWAY_AMOUNT = 0.14;

export class GrassField {
  readonly group = new Group();
  private readonly rng: SeededRandom;
  private readonly dummy = new Object3D();
  private readonly scale: number;
  private readonly y: number;
  private readonly center: [number, number];
  private readonly reducedMotion: boolean;

  /**
   * Pasto en 3D: miles de briznas agrupadas en matitas que se mecen con el viento, con flores, arbustos, hongos y rocas
   * irregulares repartidos al azar sobre un disco. Todo va en mallas instanciadas, así que es ligero.
   *
   * @param options - `seed` (azar repetible), `radius` del disco a cubrir, `y` (altura del suelo), `scale` (tamaño del
   * mundo: 1 para el mapa y unos 3.4 para las escenas grandes), `density` (matitas por unidad cuadrada del mapa),
   * `center` del disco y `accept`, que decide si un punto está libre (para esquivar calles, casas y plazas).
   */
  constructor(private readonly options: GrassFieldOptions) {
    this.rng = new SeededRandom(options.seed);
    this.scale = options.scale ?? 1;
    this.y = options.y ?? 0;
    this.center = options.center ?? [0, 0];
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const area = (Math.PI * options.radius * options.radius) / (this.scale * this.scale);
    const density = options.density ?? 6;
    this.group.add(
      this.tufts(Math.round(area * density)),
      ...this.flowers(Math.round(area * density * 0.05)),
      ...this.shrubs(Math.round(area * density * 0.008)),
      ...this.mushrooms(Math.round(area * density * 0.004)),
      this.rocks(Math.round(area * density * 0.008)),
    );
  }

  private scatter(count: number): Spot[] {
    const spots: Spot[] = [];
    for (let attempt = 0; attempt < count * 2 && spots.length < count; attempt += 1) {
      const radius = this.options.radius * Math.sqrt(this.rng.between(0, 1));
      const angle = this.rng.between(0, Math.PI * 2);
      const x = this.center[0] + Math.cos(angle) * radius;
      const z = this.center[1] + Math.sin(angle) * radius;
      if (this.options.accept?.(x, z) ?? true) spots.push({ x, z });
    }
    return spots;
  }

  private put(mesh: InstancedMesh, index: number, at: [number, number, number], size: [number, number, number], yaw = 0): void {
    this.dummy.position.set(...at);
    this.dummy.scale.set(...size);
    this.dummy.rotation.set(0, yaw, 0);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }

  private finish(mesh: InstancedMesh): InstancedMesh {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  private tuftGeometry(): BufferGeometry {
    const positions: number[] = [];
    const colors: number[] = [];
    for (let blade = 0; blade < TUFT_BLADES; blade += 1) {
      const angle = this.rng.between(0, Math.PI * 2);
      const away = this.rng.between(0, 0.14);
      const cx = Math.cos(angle) * away;
      const cz = Math.sin(angle) * away;
      const facing = this.rng.between(0, Math.PI);
      const dx = Math.cos(facing) * 0.04;
      const dz = Math.sin(facing) * 0.04;
      const height = this.rng.between(0.55, 1);
      const lean = this.rng.between(-0.14, 0.14);
      positions.push(cx - dx, 0, cz - dz, cx + dx, 0, cz + dz, cx + lean, height, cz + lean * 0.6);
      colors.push(0.45, 0.62, 0.45, 0.45, 0.62, 0.45, 1, 1, 1);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  private tufts(count: number): InstancedMesh {
    const material = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.85 });
    const uniform = { value: 0 };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniform;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uTime * ${SWAY_SPEED.toFixed(2)} + instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7) * ${SWAY_AMOUNT.toFixed(2)} * position.y * position.y;\n#endif`,
      );
    };
    const spots = this.scatter(count);
    const mesh = new InstancedMesh(this.tuftGeometry(), material, spots.length);
    spots.forEach((spot, index) => {
      const width = this.scale * this.rng.between(0.8, 1.4);
      this.put(mesh, index, [spot.x, this.y, spot.z], [width, this.scale * this.rng.between(0.35, 0.8), width], this.rng.between(0, Math.PI));
      mesh.setColorAt(index, new Color(this.rng.pick(GREENS)));
    });
    if (!this.reducedMotion) mesh.onBeforeRender = () => (uniform.value = performance.now() / 1000);
    return this.finish(mesh);
  }

  private flowers(count: number): InstancedMesh[] {
    const spots = this.scatter(count);
    const stems = new InstancedMesh(new CylinderGeometry(0.012, 0.018, 1, 5).translate(0, 0.5, 0), new MeshStandardMaterial({ color: 0x4fa86a, roughness: 0.8 }), spots.length);
    const blooms = new InstancedMesh(new SphereGeometry(0.5, 10, 8), new MeshStandardMaterial({ roughness: 0.6 }), spots.length);
    spots.forEach((spot, index) => {
      const height = this.scale * this.rng.between(0.45, 1);
      this.put(stems, index, [spot.x, this.y, spot.z], [this.scale, height, this.scale]);
      const size = this.scale * this.rng.between(0.12, 0.2);
      this.put(blooms, index, [spot.x, this.y + height, spot.z], [size, size * 0.7, size]);
      blooms.setColorAt(index, new Color(this.rng.pick(BLOOMS)));
    });
    return [this.finish(stems), this.finish(blooms)];
  }

  private shrubs(count: number): InstancedMesh[] {
    const spots = this.scatter(count);
    const material = new MeshStandardMaterial({ roughness: 0.8, map: SurfaceTextures.foliage(), bumpMap: SurfaceTextures.foliage(), bumpScale: 0.6 });
    const puffs = new InstancedMesh(new SphereGeometry(1, 10, 8), material, spots.length * 3);
    spots.forEach((spot, index) => {
      const tint = new Color(this.rng.pick(GREENS)).multiplyScalar(0.85);
      for (let puff = 0; puff < 3; puff += 1) {
        const size = this.scale * this.rng.between(0.22, 0.38);
        this.put(puffs, index * 3 + puff, [spot.x + this.rng.between(-0.3, 0.3) * this.scale, this.y + size * 0.6, spot.z + this.rng.between(-0.3, 0.3) * this.scale], [size, size * 0.75, size]);
        puffs.setColorAt(index * 3 + puff, tint);
      }
    });
    return [this.finish(puffs)];
  }

  private mushrooms(count: number): InstancedMesh[] {
    const spots = this.scatter(count);
    const stems = new InstancedMesh(new CylinderGeometry(0.05, 0.07, 1, 8).translate(0, 0.5, 0), new MeshStandardMaterial({ color: 0xfff0d6, roughness: 0.7 }), spots.length);
    const caps = new InstancedMesh(new SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ roughness: 0.55, side: DoubleSide }), spots.length);
    spots.forEach((spot, index) => {
      const height = this.scale * this.rng.between(0.12, 0.24);
      const cap = this.scale * this.rng.between(0.2, 0.34);
      this.put(stems, index, [spot.x, this.y, spot.z], [this.scale, height, this.scale]);
      this.put(caps, index, [spot.x, this.y + height, spot.z], [cap, cap * 0.8, cap]);
      caps.setColorAt(index, new Color(this.rng.pick(CAPS)));
    });
    return [this.finish(stems), this.finish(caps)];
  }

  private rockGeometry(): BufferGeometry {
    const geometry = new IcosahedronGeometry(1, 1);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const bump = 0.78 + 0.4 * Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1);
      position.setXYZ(index, x * bump, y * bump * 0.75, z * bump);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private rocks(count: number): InstancedMesh {
    const spots = this.scatter(count);
    const material = new MeshStandardMaterial({ roughness: 0.95, flatShading: true, map: SurfaceTextures.rock(), bumpMap: SurfaceTextures.rock(), bumpScale: 1.2 });
    const mesh = new InstancedMesh(this.rockGeometry(), material, spots.length);
    spots.forEach((spot, index) => {
      const size = this.scale * this.rng.between(0.12, 0.42);
      this.put(mesh, index, [spot.x, this.y + size * 0.25, spot.z], [size * this.rng.between(0.9, 1.4), size, size * this.rng.between(0.9, 1.4)], this.rng.between(0, Math.PI * 2));
      mesh.setColorAt(index, new Color(this.rng.pick(STONES)));
    });
    return this.finish(mesh);
  }
}
