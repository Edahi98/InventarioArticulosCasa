import {
  CatmullRomCurve3,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { GIANT_BARK, GIANT_CROWN_COLORS } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import { MeshMerger } from "../MeshMerger.js";
import type { SeededRandom } from "./SeededRandom.js";

export class GiantTreeBuilder {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly lobe: BufferGeometry;

  /**
   * @param rng - Azar con semilla, para que cada árbol salga igual cada vez.
   */
  constructor(private readonly rng: SeededRandom) {
    this.lobe = GiantTreeBuilder.lumpy();
  }

  /**
   * Árbol gigante de cuento: tronco grueso que se tuerce en espiral y se adelgaza hacia arriba, raíces que se abren
   * y se hunden en el pasto, dos o tres ramas curvas y copas esponjosas de muchos lóbulos abultados, de un solo color
   * vivo (amarillo, morado, rosa, verde o naranja) con lóbulos más claros encima.
   *
   * @param x - Posición en x.
   * @param z - Posición en z.
   * @param scale - Tamaño (1 mide unos 4 de alto).
   * @param color - Color de la copa; si falta, se elige al azar.
   * @returns El árbol, con su tronco sólido para el paseo.
   */
  build(x: number, z: number, scale: number, color?: number): Group {
    const tree = new Group();
    const bark = this.bark();
    const crown = color ?? this.rng.pick(GIANT_CROWN_COLORS);
    const twist = this.rng.between(0.6, 1.2) * (this.rng.chance(0.5) ? 1 : -1);
    const lean = this.rng.between(0, Math.PI * 2);
    const spine = Array.from({ length: 6 }, (_, index) => {
      const t = index / 5;
      const angle = lean + twist * t * Math.PI;
      const sway = Math.sin(t * Math.PI) * 0.35;
      return new Vector3(Math.cos(angle) * sway, t * 2.6, Math.sin(angle) * sway);
    });
    const trunkCurve = new CatmullRomCurve3(spine);
    tree.add(this.limb(trunkCurve, (t) => 0.42 * (1 - t * 0.62) + 0.22 * Math.max(0, 1 - t * 6), bark));
    const top = trunkCurve.getPointAt(1);
    this.addCrown(tree, top.clone().add(new Vector3(0, 0.4, 0)), 1.25, crown);
    const branches = 2 + Math.floor(this.rng.between(0, 2));
    for (let index = 0; index < branches; index += 1) {
      const from = trunkCurve.getPointAt(this.rng.between(0.55, 0.8));
      const angle = lean + (index / branches) * Math.PI * 2 + this.rng.between(-0.4, 0.4);
      const reach = this.rng.between(1, 1.5);
      const end = from.clone().add(new Vector3(Math.cos(angle) * reach, this.rng.between(0.5, 0.9), Math.sin(angle) * reach));
      const middle = from.clone().lerp(end, 0.5).add(new Vector3(0, -0.15, 0));
      tree.add(this.limb(new CatmullRomCurve3([from, middle, end]), (t) => 0.16 * (1 - t * 0.6), bark));
      this.addCrown(tree, end.clone().add(new Vector3(0, 0.25, 0)), this.rng.between(0.7, 0.9), crown);
    }
    const roots = 5;
    for (let index = 0; index < roots; index += 1) {
      const angle = (index / roots) * Math.PI * 2 + this.rng.between(-0.3, 0.3);
      const spread = this.rng.between(0.7, 1.05);
      const curve = new CatmullRomCurve3([
        new Vector3(Math.cos(angle) * 0.15, 0.5, Math.sin(angle) * 0.15),
        new Vector3(Math.cos(angle) * spread * 0.55, 0.16, Math.sin(angle) * spread * 0.55),
        new Vector3(Math.cos(angle) * spread, -0.08, Math.sin(angle) * spread),
      ]);
      tree.add(this.limb(curve, (t) => 0.2 * (1 - t * 0.75), bark, 10));
    }
    tree.traverse((part) => {
      part.castShadow = true;
    });
    Solid.mark(tree, { shape: "cylinder", radius: 0.5, height: 2.6, offset: [0, 1.3, 0] });
    tree.position.set(x, 0.04, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = this.rng.between(0, Math.PI * 2);
    tree.userData.sways = true;
    return MeshMerger.merge(tree);
  }

  private limb(curve: CatmullRomCurve3, radius: (t: number) => number, material: MeshStandardMaterial, segments = 22): Mesh {
    const radial = 10;
    const geometry = new TubeGeometry(curve, segments, 1, radial, false);
    const position = geometry.getAttribute("position");
    const center = new Vector3();
    const vertex = new Vector3();
    for (let ring = 0; ring <= segments; ring += 1) {
      const t = ring / segments;
      curve.getPointAt(t, center);
      const size = radius(t);
      for (let side = 0; side <= radial; side += 1) {
        const index = ring * (radial + 1) + side;
        vertex.fromBufferAttribute(position, index).sub(center).multiplyScalar(size * (1 + 0.08 * Math.sin(side * 2.1 + ring))).add(center);
        position.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }
    geometry.computeVertexNormals();
    return new Mesh(geometry, material);
  }

  private addCrown(tree: Group, center: Vector3, size: number, color: number): void {
    const main = this.material(color);
    const light = this.material(GiantTreeBuilder.lighten(color));
    const lobes = 7;
    for (let index = 0; index < lobes; index += 1) {
      const angle = (index / lobes) * Math.PI * 2 + this.rng.between(-0.3, 0.3);
      const out = index === 0 ? 0 : size * this.rng.between(0.55, 0.8);
      const lobe = new Mesh(this.lobe, index % 3 === 0 ? light : main);
      lobe.position.set(center.x + Math.cos(angle) * out, center.y + (index === 0 ? size * 0.35 : this.rng.between(-0.2, 0.25) * size), center.z + Math.sin(angle) * out);
      const radius = size * (index === 0 ? 0.85 : this.rng.between(0.5, 0.68));
      lobe.scale.set(radius, radius * 0.82, radius);
      lobe.rotation.set(this.rng.between(0, 3), this.rng.between(0, 3), 0);
      tree.add(lobe);
    }
  }

  private static lumpy(): BufferGeometry {
    const geometry = new IcosahedronGeometry(1, 2);
    const position = geometry.getAttribute("position");
    const vertex = new Vector3();
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index);
      const bump = 1 + 0.09 * Math.sin(vertex.x * 5.1 + vertex.y * 3.7) * Math.cos(vertex.z * 4.3 - vertex.y * 2.2);
      vertex.multiplyScalar(bump);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private static lighten(color: number): number {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    const mix = (value: number): number => Math.round(value + (255 - value) * 0.35);
    return (mix(r) << 16) | (mix(g) << 8) | mix(b);
  }

  private bark(): MeshStandardMaterial {
    const cached = this.materials.get(-1);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color: GIANT_BARK, roughness: 0.85, map: SurfaceTextures.bark(), bumpMap: SurfaceTextures.bark(), bumpScale: 1.2 });
    this.materials.set(-1, created);
    return created;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.75, map: SurfaceTextures.foliage(), bumpMap: SurfaceTextures.foliage(), bumpScale: 0.8 });
    this.materials.set(color, created);
    return created;
  }
}
