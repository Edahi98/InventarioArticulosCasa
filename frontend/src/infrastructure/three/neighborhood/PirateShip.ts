import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type CanvasTexture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { VehicleDriver } from "./VehicleDriver.js";

export type ShipKind = "pirata" | "galeon" | "goleta";

export interface ShipSpinner {
  object: Group;
  speed: number;
  axis: "x" | "z" | "remo";
}

export interface BuiltShip {
  group: Group;
  lanterns: MeshStandardMaterial[];
  spinners: ShipSpinner[];
}

interface Hull {
  length: number;
  width: number;
  depth: number;
}

const GOLD = 0xffc94d;
const DARK = 0x2a2233;
const HULLS: Record<ShipKind, Hull> = {
  pirata: { length: 2.4, width: 0.42, depth: 0.42 },
  galeon: { length: 3.0, width: 0.5, depth: 0.5 },
  goleta: { length: 2.2, width: 0.34, depth: 0.34 },
};
const HULL_COLORS: Record<ShipKind, number> = { pirata: 0x8a5a42, galeon: 0xb07a4a, goleta: 0x4a6fa8 };
const TONES: BearTone[] = ["lilac", "sky", "sun", "rose"];

export class PirateShip {
  private static readonly materials = new Map<string, MeshStandardMaterial>();

  /**
   * Barco de juguete de mucho detalle, mirando hacia +x: casco curvo de tablones con franja dorada, portillas y
   * cañones; castillo de popa con ventanas que brillan y farol; mástiles con vergas, velas combadas (rotas y
   * remendadas en el pirata, con cruz en el galeón, de cuchillo en la goleta), bandera negra con calavera, bauprés y
   * mascarón de proa dorado, timón, barriles y cofre del tesoro, nido del cuervo con vigía y tripulación completa de
   * ositos piratas con tricornio y parche.
   *
   * @param kind - Pirata, galeón o goleta.
   * @param seed - Número para variar a la tripulación.
   * @returns El barco, sus faroles (se encienden de noche) y nada que gire.
   */
  static build(kind: ShipKind, seed: number): BuiltShip {
    const ship = new Group();
    const hull = HULLS[kind];
    const lanterns: MeshStandardMaterial[] = [];
    const top = (x: number): number => 0.36 + 0.16 * (x / (hull.length / 2)) ** 2;
    const half = (x: number): number => {
      const t = x / (hull.length / 2);
      const bow = t > 0 ? 1 - t ** 2.2 : 1 - Math.abs(t) ** 5;
      return hull.width * Math.max(bow, 0.02) ** 0.55;
    };
    ship.add(this.hull(hull, top, half, HULL_COLORS[kind]), this.deck(hull, half), ...this.trim(hull, top, half));
    ship.add(...this.cannons(hull, half, kind === "goleta" ? 2 : kind === "galeon" ? 4 : 3));
    if (kind !== "goleta") ship.add(this.sternCastle(hull, lanterns, kind));
    const masts = kind === "galeon" ? [0.75, 0.05, -0.65] : kind === "pirata" ? [0.45, -0.3] : [0.4, -0.35];
    masts.forEach((x, index) => ship.add(this.mast(kind, x, index === 0 && kind !== "goleta" ? 1.55 : 1.85, index)));
    ship.add(this.flag(kind, masts));
    ship.add(this.bowsprit(hull, top));
    ship.add(...this.cargo(hull, kind));
    const crew = this.crew(kind, hull, masts, seed);
    ship.add(...crew);
    ship.traverse((part) => {
      part.castShadow = true;
    });
    return { group: ship, lanterns, spinners: [] };
  }

  private static material(key: string, create: () => MeshStandardMaterial): MeshStandardMaterial {
    const found = this.materials.get(key);
    if (found) return found;
    const made = create();
    this.materials.set(key, made);
    return made;
  }

  private static hull(hull: Hull, top: (x: number) => number, half: (x: number) => number, color: number): Mesh {
    const rows = 32;
    const cols = 16;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= rows; i += 1) {
      const x = -hull.length / 2 + (i / rows) * hull.length;
      const width = half(x);
      const keel = hull.depth * (1 - 0.6 * Math.abs(x / (hull.length / 2)) ** 3);
      for (let j = 0; j <= cols; j += 1) {
        const angle = (j / cols) * Math.PI;
        const down = Math.sin(angle) ** 0.7;
        positions.push(x, top(x) - keel * down - 0.05, width * Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** 0.7);
        uvs.push((i / rows) * 4, (j / cols) * 2);
      }
    }
    for (let i = 0; i < rows; i += 1) {
      for (let j = 0; j < cols; j += 1) {
        const a = i * (cols + 1) + j;
        const b = a + cols + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const planks = this.material(`casco-${color}`, () => new MeshStandardMaterial({ color, roughness: 0.8, side: DoubleSide, map: SurfaceTextures.bark(), bumpMap: SurfaceTextures.bark(), bumpScale: 1 }));
    return new Mesh(geometry, planks);
  }

  private static deck(hull: Hull, half: (x: number) => number): Mesh {
    const outline = new Shape();
    const steps = 20;
    for (let i = 0; i <= steps; i += 1) {
      const x = -hull.length / 2 + (i / steps) * hull.length;
      if (i === 0) outline.moveTo(x, half(x) * 0.96);
      else outline.lineTo(x, half(x) * 0.96);
    }
    for (let i = steps; i >= 0; i -= 1) {
      const x = -hull.length / 2 + (i / steps) * hull.length;
      outline.lineTo(x, -half(x) * 0.96);
    }
    const deck = new Mesh(new ShapeGeometry(outline), CraftMaterials.wood(0xd29a6a));
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = 0.3;
    return deck;
  }

  private static trim(hull: Hull, top: (x: number) => number, half: (x: number) => number): Mesh[] {
    const gold = this.material("oro", () => new MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.5 }));
    return [-1, 1].flatMap((side) => {
      const points = Array.from({ length: 14 }, (_, index) => {
        const x = -hull.length / 2 + 0.02 + (index / 13) * (hull.length - 0.04);
        return new Vector3(x, top(x) - 0.06, side * half(x));
      });
      const rail = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 40, 0.022, 6), gold);
      const lower = points.map((point) => new Vector3(point.x, point.y - 0.14, point.z * 0.97));
      return [rail, new Mesh(new TubeGeometry(new CatmullRomCurve3(lower), 40, 0.012, 5), gold)];
    });
  }

  private static cannons(hull: Hull, half: (x: number) => number, count: number): Mesh[] {
    const iron = this.material("hierro", () => new MeshStandardMaterial({ color: DARK, roughness: 0.4, metalness: 0.4 }));
    return [-1, 1].flatMap((side) =>
      Array.from({ length: count }, (_, index) => {
        const x = -hull.length * 0.25 + (index / Math.max(count - 1, 1)) * hull.length * 0.45;
        const cannon = new Mesh(new CylinderGeometry(0.03, 0.04, 0.18, 10), iron);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(x, 0.24, side * (half(x) + 0.03));
        return cannon;
      }),
    );
  }

  private static sternCastle(hull: Hull, lanterns: MeshStandardMaterial[], kind: ShipKind): Group {
    const castle = new Group();
    const wood = CraftMaterials.wood(kind === "galeon" ? 0x9a6040 : 0x6b4a3a);
    const body = new Mesh(new RoundedBoxGeometry(0.5, 0.32, hull.width * 1.7, 2, 0.06), wood);
    body.position.y = 0.48;
    const roof = new Mesh(new RoundedBoxGeometry(0.56, 0.05, hull.width * 1.8, 2, 0.02), CraftMaterials.paint(GOLD));
    roof.position.y = 0.66;
    const glow = CraftMaterials.lantern();
    lanterns.push(glow);
    const windows = [-0.12, 0, 0.12].map((z) => {
      const pane = new Mesh(new RoundedBoxGeometry(0.02, 0.1, 0.08, 2, 0.02), glow);
      pane.position.set(-0.26, 0.48, z * (hull.width / 0.42));
      return pane;
    });
    const lantern = new Mesh(new SphereGeometry(0.06, 12, 10), glow);
    lantern.position.set(-0.3, 0.8, 0);
    const hook = new Mesh(new CylinderGeometry(0.01, 0.01, 0.16, 5), CraftMaterials.paint(DARK));
    hook.position.set(-0.3, 0.74, 0);
    castle.add(body, roof, ...windows, lantern, hook);
    castle.position.x = -hull.length / 2 + 0.3;
    return castle;
  }

  private static sailTexture(kind: ShipKind): CanvasTexture {
    return TextureCanvas.build(`vela-${kind}`, 128, 128, false, (context, rng, width, height) => {
      const base = { pirata: "#e9dcc4", galeon: "#fff6e6", goleta: "#fffaf2" }[kind];
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(120,90,70,0.25)";
      context.lineWidth = 1;
      for (let x = 8; x < width; x += 14) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      if (kind === "galeon") {
        context.fillStyle = "#e8402d";
        context.fillRect(width * 0.42, height * 0.15, width * 0.16, height * 0.7);
        context.fillRect(width * 0.18, height * 0.38, width * 0.64, height * 0.16);
      }
      if (kind !== "pirata") return;
      ["#c9b48a", "#b8d0e8", "#f0b8c8"].forEach((patch) => {
        context.fillStyle = patch;
        const x = rng.between(10, width - 40);
        const y = rng.between(10, height - 40);
        context.fillRect(x, y, 24, 20);
        context.strokeStyle = "rgba(80,50,40,0.6)";
        context.setLineDash([3, 3]);
        context.strokeRect(x, y, 24, 20);
        context.setLineDash([]);
      });
      context.globalCompositeOperation = "destination-out";
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.ellipse(rng.between(15, width - 15), rng.between(20, height - 10), rng.between(4, 9), rng.between(3, 7), rng.between(0, 3), 0, Math.PI * 2);
        context.fill();
      }
      context.beginPath();
      context.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) context.lineTo(x, height - (x % 16 === 0 ? 10 : 2));
      context.lineTo(width, height);
      context.fill();
    });
  }

  private static mast(kind: ShipKind, x: number, height: number, index: number): Group {
    const mast = new Group();
    const pole = new Mesh(new CylinderGeometry(0.03, 0.04, height, 8), CraftMaterials.wood(0x6b4a3a));
    pole.position.y = 0.3 + height / 2;
    mast.add(pole);
    const sail = this.material(`vela-${kind}`, () => new MeshStandardMaterial({ map: this.sailTexture(kind), side: DoubleSide, roughness: 0.85, alphaTest: 0.5, transparent: false }));
    if (kind === "goleta") {
      const outline = new Shape();
      outline.moveTo(0, 0);
      outline.lineTo(0, height * 0.85);
      outline.lineTo(-0.55, 0.05);
      outline.closePath();
      const triangle = new Mesh(new ShapeGeometry(outline), sail);
      triangle.position.set(-0.03, 0.45, 0);
      triangle.rotation.y = 0.25;
      mast.add(triangle);
    }
    if (kind !== "goleta") {
      [0.55, 1.05].forEach((level, tier) => {
        const width = 0.75 - tier * 0.18;
        const yard = new Mesh(new CylinderGeometry(0.015, 0.015, width + 0.1, 6), CraftMaterials.wood(0x6b4a3a));
        yard.rotation.x = Math.PI / 2;
        yard.position.y = 0.3 + level + 0.42 - tier * 0.04;
        const cloth = new PlaneGeometry(width, 0.42, 6, 4);
        const position = cloth.getAttribute("position");
        for (let vertex = 0; vertex < position.count; vertex += 1) {
          const u = position.getX(vertex) / width;
          const v = position.getY(vertex) / 0.42;
          position.setZ(vertex, (1 - (2 * u) ** 2) * 0.1 * (0.6 + (0.5 - v) * 0.6));
        }
        cloth.computeVertexNormals();
        const panel = new Mesh(cloth, sail);
        panel.rotation.y = Math.PI / 2;
        panel.position.set(0.04, 0.3 + level + 0.2 - tier * 0.04, 0);
        mast.add(yard, panel);
      });
    }
    if (index === 0 && kind !== "goleta") {
      const nest = new Mesh(new CylinderGeometry(0.12, 0.1, 0.1, 12, 1, true), CraftMaterials.wood(0x8a5a42));
      nest.position.y = 0.3 + height - 0.12;
      const floor = new Mesh(new CylinderGeometry(0.11, 0.11, 0.02, 12), CraftMaterials.wood(0x8a5a42));
      floor.position.y = 0.3 + height - 0.17;
      mast.add(nest, floor);
    }
    mast.position.x = x;
    return mast;
  }

  private static flag(kind: ShipKind, masts: number[]): Mesh {
    const texture = TextureCanvas.build(`bandera-${kind}`, 96, 64, false, (context, _rng, width, height) => {
      context.fillStyle = kind === "galeon" ? "#e8402d" : "#1d1622";
      context.fillRect(0, 0, width, height);
      context.fillStyle = kind === "galeon" ? "#ffd84d" : "#fffaf2";
      if (kind === "galeon") {
        context.fillRect(0, height * 0.35, width, height * 0.3);
        return;
      }
      context.beginPath();
      context.arc(width / 2, height * 0.4, 13, 0, Math.PI * 2);
      context.fill();
      context.fillRect(width / 2 - 8, height * 0.5, 16, 10);
      context.fillStyle = "#1d1622";
      [-5, 5].forEach((dx) => {
        context.beginPath();
        context.arc(width / 2 + dx, height * 0.38, 3.5, 0, Math.PI * 2);
        context.fill();
      });
      context.strokeStyle = "#fffaf2";
      context.lineWidth = 4;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(width / 2 - 24, height * 0.62);
      context.lineTo(width / 2 + 24, height * 0.92);
      context.moveTo(width / 2 + 24, height * 0.62);
      context.lineTo(width / 2 - 24, height * 0.92);
      context.stroke();
    });
    const geometry = new PlaneGeometry(0.36, 0.24, 6, 2);
    const position = geometry.getAttribute("position");
    for (let vertex = 0; vertex < position.count; vertex += 1) position.setZ(vertex, Math.sin(position.getX(vertex) * 12) * 0.025);
    geometry.computeVertexNormals();
    const flag = new Mesh(geometry, new MeshStandardMaterial({ map: texture, side: DoubleSide, roughness: 0.8 }));
    flag.position.set((masts[0] ?? 0) - 0.19, 0.3 + (kind === "goleta" ? 1.85 : 1.55) + 0.1, 0);
    return flag;
  }

  private static bowsprit(hull: Hull, top: (x: number) => number): Group {
    const bow = new Group();
    const front = hull.length / 2;
    const spar = new Mesh(new CylinderGeometry(0.02, 0.03, 0.7, 6), CraftMaterials.wood(0x6b4a3a));
    spar.rotation.z = -Math.PI / 2 + 0.35;
    spar.position.set(front + 0.25, top(front) + 0.06, 0);
    const gold = this.material("oro", () => new MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.5 }));
    const figure = new Group();
    const body = new Mesh(new CylinderGeometry(0.04, 0.06, 0.2, 10), gold);
    body.rotation.z = -0.6;
    const head = new Mesh(new SphereGeometry(0.06, 12, 10), gold);
    head.position.set(0.07, 0.1, 0);
    const ears = [-1, 1].map((side) => {
      const ear = new Mesh(new SphereGeometry(0.025, 8, 6), gold);
      ear.position.set(0.06, 0.16, side * 0.04);
      return ear;
    });
    figure.add(body, head, ...ears);
    figure.position.set(front + 0.02, top(front) - 0.12, 0);
    bow.add(spar, figure);
    return bow;
  }

  private static cargo(hull: Hull, kind: ShipKind): Mesh[] {
    const barrel = new CylinderGeometry(0.06, 0.06, 0.13, 12);
    const items: Mesh[] = [0.15, 0.28].map((x, index) => {
      const keg = new Mesh(barrel, CraftMaterials.wood(0xa87050));
      keg.position.set(x, 0.365, (index % 2 === 0 ? 1 : -1) * hull.width * 0.5);
      return keg;
    });
    if (kind === "goleta") return items;
    const chest = new Mesh(new RoundedBoxGeometry(0.2, 0.11, 0.13, 2, 0.02), CraftMaterials.wood(0x8a4a2a));
    chest.position.set(-0.05, 0.36, 0.05);
    const lidShape = new Shape();
    lidShape.absarc(0, 0, 0.065, 0, Math.PI, false);
    const lid = new Mesh(new ExtrudeGeometry(lidShape, { depth: 0.2, bevelEnabled: false, curveSegments: 8 }), CraftMaterials.wood(0x8a4a2a));
    lid.rotation.y = Math.PI / 2;
    lid.position.set(-0.15, 0.415, 0.05);
    const gold = this.material("oro", () => new MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.5 }));
    const coins = new Mesh(new SphereGeometry(0.05, 10, 8), gold);
    coins.scale.set(1.5, 0.5, 1.1);
    coins.position.set(-0.05, 0.48, 0.05);
    const wheel = new Mesh(new TorusGeometry(0.08, 0.012, 6, 16), CraftMaterials.wood(0x6b4a3a));
    wheel.position.set(-hull.length / 2 + 0.78, 0.5, 0);
    wheel.rotation.y = Math.PI / 2;
    return [...items, chest, lid, coins, wheel];
  }

  private static crew(kind: ShipKind, hull: Hull, masts: number[], seed: number): Group[] {
    const captain = VehicleDriver.standing(TONES[seed % TONES.length] as BearTone, "pirata", 0.13);
    captain.group.position.set(-hull.length / 2 + 0.64, 0.3, 0);
    captain.group.rotation.y = Math.PI / 2;
    if (kind === "goleta") return [captain.group];
    const lookout = VehicleDriver.standing(TONES[(seed + 1) % TONES.length] as BearTone, kind === "galeon" ? "capitan" : "pirata", 0.07);
    lookout.group.position.set(masts[0] ?? 0, 0.3 + 1.55 - 0.16, 0);
    lookout.group.rotation.y = Math.PI / 2;
    return [captain.group, lookout.group];
  }
}
