import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GrassField } from "../GrassField.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import { DECK_TOP } from "./ArchBridge.js";
import { SeededRandom } from "./SeededRandom.js";
import type { TreeFactory } from "./TreeFactory.js";

export type OutpostKind = "faro" | "picnic" | "fuente";

export const OUTPOST_RADIUS = 3.1;

const GRASS = 0xbfe9d5;
const SOIL = 0xb98b73;

export class Outpost {
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * @param trees - Fábrica de árboles compartida.
   */
  constructor(private readonly trees: TreeFactory) {}

  /**
   * Islita al otro lado de un puente: un disco de pasto a la altura de la calzada, con su base de tierra, pasto,
   * árboles y una atracción según el tipo (un faro, un picnic con mesa y sombrilla, o una fuente). Su suelo es
   * caminable y la atracción es sólida.
   *
   * @param kind - Qué hay en ella.
   * @param seed - Semilla del azar para el pasto y los árboles.
   * @returns El grupo de la islita centrado en el origen (hay que colocarlo) y el vidrio luminoso que tenga.
   */
  build(kind: OutpostKind, seed: string): { group: Group; glow: MeshStandardMaterial | null } {
    const rng = new SeededRandom(seed);
    const group = new Group();
    const top = new Mesh(new CylinderGeometry(OUTPOST_RADIUS, OUTPOST_RADIUS * 0.97, 0.36, 40), this.material(GRASS));
    top.position.y = DECK_TOP - 0.18;
    const soil = new Mesh(new ConeGeometry(OUTPOST_RADIUS * 0.97, OUTPOST_RADIUS * 1.5, 24), this.material(SOIL));
    soil.rotation.x = Math.PI;
    soil.position.y = DECK_TOP - 0.36 - OUTPOST_RADIUS * 0.75;
    group.add(top, soil, new GrassField({ seed, radius: OUTPOST_RADIUS - 0.35, y: DECK_TOP, scale: 1.4, density: 5, accept: (x, z) => Math.hypot(x, z) > 1.1 }).group);
    [0.8, 2.4, 4.2].forEach((angle, index) => {
      const crown = this.trees.build(Math.cos(angle + 1.7) * (OUTPOST_RADIUS - 0.8), Math.sin(angle + 1.7) * (OUTPOST_RADIUS - 0.8), rng.between(0.8, 1.15), index === 1);
      crown.position.y = DECK_TOP;
      group.add(crown);
    });
    const attraction = { faro: () => this.lighthouse(), picnic: () => this.picnic(), fuente: () => this.fountain() }[kind]();
    group.add(attraction.group);
    return { group, glow: attraction.glow };
  }

  private material(color: number, roughness = 0.75): MeshStandardMaterial {
    const key = color * 10 + Math.round(roughness * 10);
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.3 });
    this.materials.set(key, created);
    return created;
  }

  private cylinder(top: number, bottom: number, height: number, color: number, y: number): Mesh {
    const mesh = new Mesh(new CylinderGeometry(top, bottom, height, 24), this.material(color));
    mesh.position.y = y;
    return mesh;
  }

  private lighthouse(): { group: Group; glow: MeshStandardMaterial } {
    const group = new Group();
    const glow = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.6 });
    [0xfffaf2, 0xff6b8f, 0xfffaf2, 0xff6b8f].forEach((color, index) => {
      const radiusBottom = 0.7 - index * 0.07;
      group.add(this.cylinder(radiusBottom - 0.07, radiusBottom, 0.8, color, DECK_TOP + 0.4 + index * 0.8));
    });
    const gallery = this.cylinder(0.62, 0.62, 0.1, 0x6b4a6a, DECK_TOP + 3.25);
    const lantern = new Mesh(new SphereGeometry(0.34, 16, 12), glow);
    lantern.position.y = DECK_TOP + 3.6;
    const roof = new Mesh(new ConeGeometry(0.46, 0.55, 18), this.material(0xff6b8f));
    roof.position.y = DECK_TOP + 4.1;
    group.add(gallery, lantern, roof);
    group.position.set(-0.4, 0, -0.2);
    Solid.mark(group, { shape: "cylinder", radius: 0.72, height: 3.2, offset: [0, DECK_TOP + 1.6, 0] });
    return { group, glow };
  }

  private picnic(): { group: Group; glow: null } {
    const group = new Group();
    const wood = 0xc4805a;
    const table = new Mesh(new RoundedBoxGeometry(1.5, 0.08, 0.95, 3, 0.03), this.material(0xfffaf2));
    table.position.y = DECK_TOP + 0.5;
    const cloth = new Mesh(new RoundedBoxGeometry(1.52, 0.02, 0.5, 2, 0.01), this.material(0xff8fb7));
    cloth.position.y = DECK_TOP + 0.55;
    const legs = [-0.6, 0.6].map((x) => {
      const leg = this.cylinder(0.05, 0.05, 0.5, wood, DECK_TOP + 0.25);
      leg.position.x = x;
      return leg;
    });
    const benches = [-0.78, 0.78].map((z) => {
      const bench = new Mesh(new RoundedBoxGeometry(1.5, 0.08, 0.28, 2, 0.03), this.material(wood));
      bench.position.set(0, DECK_TOP + 0.3, z);
      return bench;
    });
    const pole = this.cylinder(0.03, 0.03, 1.5, 0x6b4a6a, DECK_TOP + 0.75);
    const umbrella = new Mesh(new ConeGeometry(1.05, 0.5, 20), this.material(0x7fd0ea));
    umbrella.position.y = DECK_TOP + 1.65;
    const basket = new Mesh(new RoundedBoxGeometry(0.3, 0.18, 0.22, 3, 0.06), this.material(0xffe35c));
    basket.position.set(0.2, DECK_TOP + 0.65, 0);
    group.add(table, cloth, ...legs, ...benches, pole, umbrella, basket);
    Solid.mark(table, { shape: "box", size: [1.5, 0.8, 0.95], offset: [0, -0.3, 0] });
    benches.forEach((bench) => Solid.mark(bench, { shape: "box", size: [1.5, 0.5, 0.28], offset: [0, -0.1, 0] }));
    group.position.set(-0.3, 0, -0.1);
    return { group, glow: null };
  }

  private fountain(): { group: Group; glow: null } {
    const group = new Group();
    const rim = this.cylinder(1.05, 1.1, 0.42, 0xcfc3e6, DECK_TOP + 0.21);
    const water = this.cylinder(0.88, 0.88, 0.05, 0x8fd3f0, DECK_TOP + 0.4);
    const column = this.cylinder(0.12, 0.2, 0.9, 0xfff6dc, DECK_TOP + 0.75);
    const bowl = new Mesh(new SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.material(0xcfc3e6));
    bowl.position.y = DECK_TOP + 1.2;
    const spout = new Mesh(new SphereGeometry(0.16, 14, 10), this.material(0x8fd3f0));
    spout.position.y = DECK_TOP + 1.4;
    group.add(rim, water, column, bowl, spout);
    Solid.mark(group, { shape: "cylinder", radius: 1.1, height: 0.42, offset: [0, DECK_TOP + 0.21, 0] });
    group.position.set(-0.2, 0, 0.1);
    return { group, glow: null };
  }
}
