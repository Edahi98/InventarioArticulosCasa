import { CatmullRomCurve3, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";

export const DECK_TOP = 0.06;
export const DECK_WIDTH = 1.7;

const ARCH = 0xfffaf2;
const ACCENT = 0xff6b8f;
const DECK = 0x6b5a73;
const STRIPE = 0xfff6dc;
const POST = 0x6b4a6a;
const RIB_OFFSET = DECK_WIDTH / 2 + 0.16;
const WATER = -1.4;

export interface BridgeParts {
  group: Group;
  lamps: MeshStandardMaterial[];
}

export class ArchBridge {
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Puente de arco de acero como el de la Exposición de Shanghái, en miniatura: dos costillas blancas que nacen
   * bajo la calzada, suben por encima de ella y se unen en la cima; de las costillas cuelgan tirantes que sostienen
   * la calzada, con travesaños arriba, pilares hasta el agua, barandales y faroles. La calzada y los barandales son
   * sólidos: se puede caminar y manejar por encima, y no se cae uno por los lados.
   *
   * @param from - Punto donde empieza, sobre el suelo de la primera isla.
   * @param to - Punto donde termina, sobre el suelo de la segunda isla.
   * @returns El puente armado con su sistema de coordenadas ya colocado en el mundo, y los vidrios de sus faroles.
   */
  build(from: Vector3, to: Vector3): BridgeParts {
    const group = new Group();
    const lamps: MeshStandardMaterial[] = [];
    const span = Math.hypot(to.x - from.x, to.z - from.z);
    const crown = DECK_TOP + Math.max(2.1, span * 0.27);
    const rise = (x: number): number => -0.35 + (crown + 0.35) * (1 - (2 * x / span) ** 2);

    group.add(...this.deck(span));
    [-1, 1].forEach((side) => {
      group.add(this.rib(span, rise, side), ...this.hangers(span, rise, side), this.rail(span, side));
    });
    group.add(...this.braces(span, rise), ...this.piers(span), ...this.lampPosts(span, lamps));

    group.position.set((from.x + to.x) / 2, 0, (from.z + to.z) / 2);
    group.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
    return { group, lamps };
  }

  private material(color: number, roughness = 0.6): MeshStandardMaterial {
    const key = color * 10 + Math.round(roughness * 10);
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.25 });
    this.materials.set(key, created);
    return created;
  }

  private deck(span: number): Mesh[] {
    const slab = new Mesh(new RoundedBoxGeometry(span, 0.16, DECK_WIDTH, 3, 0.06), this.material(DECK, 0.8));
    slab.position.y = DECK_TOP - 0.08;
    Solid.mark(slab, { shape: "box", size: [span, 0.5, DECK_WIDTH + 0.1], offset: [0, -0.17, 0] });
    const stripes = Array.from({ length: Math.floor(span / 0.9) }, (_, index) => {
      const dash = new Mesh(new RoundedBoxGeometry(0.4, 0.012, 0.07, 2, 0.005), this.material(STRIPE));
      dash.position.set(-span / 2 + 0.45 + index * 0.9, DECK_TOP + 0.004, 0);
      return dash;
    });
    const curbs = [-1, 1].map((side) => {
      const curb = new Mesh(new RoundedBoxGeometry(span, 0.1, 0.16, 2, 0.04), this.material(ACCENT));
      curb.position.set(0, DECK_TOP + 0.04, side * (DECK_WIDTH / 2 - 0.02));
      return curb;
    });
    return [slab, ...stripes, ...curbs];
  }

  private rib(span: number, rise: (x: number) => number, side: number): Mesh {
    const points = Array.from({ length: 33 }, (_, index) => {
      const x = -span / 2 + (index / 32) * span;
      return new Vector3(x, rise(x), side * RIB_OFFSET);
    });
    return new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 64, 0.1, 10), this.material(ARCH, 0.45));
  }

  private hangers(span: number, rise: (x: number) => number, side: number): Mesh[] {
    const items: Mesh[] = [];
    for (let x = -span / 2 + 1.1; x <= span / 2 - 1.1; x += 0.85) {
      const top = rise(x);
      const bottom = DECK_TOP + 0.1;
      if (top - bottom < 0.4) continue;
      const cable = new Mesh(new CylinderGeometry(0.02, 0.02, top - bottom, 6), this.material(0xe6ebf2, 0.3));
      cable.position.set(x, (top + bottom) / 2, side * RIB_OFFSET);
      items.push(cable);
    }
    return items;
  }

  private rail(span: number, side: number): Mesh {
    const rail = new Mesh(new RoundedBoxGeometry(span, 0.26, 0.09, 2, 0.04), this.material(ARCH, 0.5));
    rail.position.set(0, DECK_TOP + 0.13, side * (DECK_WIDTH / 2 + 0.03));
    Solid.mark(rail, { shape: "box", size: [span, 0.5, 0.12], offset: [0, 0.1, 0] });
    return rail;
  }

  private braces(span: number, rise: (x: number) => number): Mesh[] {
    const items: Mesh[] = [];
    for (let x = -span / 2 + 1.6; x <= span / 2 - 1.6; x += 1.7) {
      const y = rise(x);
      if (y < DECK_TOP + 1.2) continue;
      const brace = new Mesh(new CylinderGeometry(0.055, 0.055, RIB_OFFSET * 2, 8), this.material(ACCENT, 0.5));
      brace.rotation.x = Math.PI / 2;
      brace.position.set(x, y, 0);
      items.push(brace);
    }
    return items;
  }

  private piers(span: number): Mesh[] {
    return [-0.28, 0.28].map((at) => {
      const pier = new Mesh(new CylinderGeometry(0.2, 0.32, DECK_TOP - 0.16 - WATER, 14), this.material(ARCH, 0.6));
      pier.position.set(span * at, (DECK_TOP - 0.16 + WATER) / 2, 0);
      return pier;
    });
  }

  private lampPosts(span: number, lamps: MeshStandardMaterial[]): Group[] {
    return [-1, 1].flatMap((end) =>
      [-1, 1].map((side) => {
        const lamp = new Group();
        const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 });
        lamps.push(glass);
        const bulb = new Mesh(new SphereGeometry(0.13, 12, 10), glass);
        bulb.position.y = 1.3;
        const pole = new Mesh(new CylinderGeometry(0.03, 0.045, 1.2, 8), this.material(POST, 0.7));
        pole.position.y = 0.65;
        lamp.add(pole, bulb);
        lamp.position.set(end * (span / 2 - 0.35), DECK_TOP, side * (DECK_WIDTH / 2 + 0.03));
        return lamp;
      }),
    );
  }
}
