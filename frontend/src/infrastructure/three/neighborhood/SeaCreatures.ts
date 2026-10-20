import {
  CapsuleGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { CORAL_SHELF_Y, CRABS_PER_ISLAND, JELLYFISH, MANTAS, SEA_WATER_Y, TURTLES } from "../../../constantes/barrio_constantes.js";
import { SeaTextures } from "../scenes/SeaTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

interface Swimmer {
  group: Group;
  parts: Group[];
  island: IslandCircle;
  distance: number;
  depth: number;
  speed: number;
  phase: number;
  kind: "tortuga" | "manta" | "medusa" | "cangrejo";
}

const JELLY_COLORS = [0xff9fd0, 0xb98cf0, 0x7fe0f0, 0xffd84d] as const;

export class SeaCreatures {
  readonly group = new Group();
  private readonly swimmers: Swimmer[] = [];
  private readonly jellyGlow: MeshStandardMaterial[] = [];
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly ball = new SphereGeometry(1, 16, 12);
  private readonly octopusArms: Group[] = [];

  /**
   * Criaturas del mar alrededor de las islas: tortugas que nadan aleteando, mantarrayas que planean ondulando las alas,
   * medusas que laten y brillan de noche, un pulpo sobre el arrecife que mueve los brazos y cangrejitos rojos que
   * caminan de lado por la orilla, justo sobre el agua.
   *
   * @param islands - Círculos de las islas.
   */
  constructor(islands: IslandCircle[]) {
    const rng = new SeededRandom("criaturas");
    const pick = (index: number): IslandCircle => islands[index % islands.length] as IslandCircle;
    for (let index = 0; index < TURTLES; index += 1) this.swim("tortuga", this.turtle(), pick(index + 1), rng.between(1.55, 1.8), rng.between(-3.6, -2.6), 0.05, rng);
    for (let index = 0; index < MANTAS; index += 1) this.swim("manta", this.manta(), pick(index), rng.between(1.6, 1.9), rng.between(-4.3, -3.2), -0.04, rng);
    for (let index = 0; index < JELLYFISH; index += 1) this.swim("medusa", this.jelly(JELLY_COLORS[index % JELLY_COLORS.length] as number), pick(index), rng.between(1.12, 1.3), rng.between(CORAL_SHELF_Y + 0.35, CORAL_SHELF_Y + 0.6), 0.012, rng);
    islands.forEach((island) => {
      for (let index = 0; index < CRABS_PER_ISLAND; index += 1) this.swim("cangrejo", this.crab(), island, 0.965, SEA_WATER_Y + 0.12, 0.012 * (index % 2 === 0 ? 1 : -1), rng);
    });
    const main = islands[0];
    if (main) this.group.add(this.octopus(main, rng));
    this.update(0, 0, false);
  }

  /**
   * Hace nadar, aletear, latir y caminar a las criaturas; las medusas brillan según la noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` quedan quietas (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.jellyGlow.forEach((material) => {
      material.emissiveIntensity = 0.25 + night * 1.6;
    });
    this.swimmers.forEach((swimmer) => {
      const angle = swimmer.phase + t * swimmer.speed;
      const forward = Math.sign(swimmer.speed) || 1;
      const x = swimmer.island.x + Math.cos(angle) * swimmer.island.radius * swimmer.distance;
      const z = swimmer.island.z + Math.sin(angle) * swimmer.island.radius * swimmer.distance;
      const animations: Record<Swimmer["kind"], () => void> = {
        tortuga: () => {
          swimmer.group.position.set(x, swimmer.depth + Math.sin(t * 0.6 + swimmer.phase) * 0.25, z);
          swimmer.group.rotation.y = Math.atan2(-Math.cos(angle) * forward, -Math.sin(angle) * forward);
          swimmer.parts.forEach((flipper, index) => {
            flipper.rotation.x = Math.sin(t * 2.4 + index * Math.PI) * 0.5;
          });
        },
        manta: () => {
          swimmer.group.position.set(x, swimmer.depth + Math.sin(t * 0.4 + swimmer.phase) * 0.4, z);
          swimmer.group.rotation.y = Math.atan2(-Math.cos(angle) * forward, -Math.sin(angle) * forward);
          swimmer.parts.forEach((wing, index) => {
            wing.rotation.x = (index === 0 ? 1 : -1) * Math.sin(t * 1.6 + swimmer.phase) * 0.35;
          });
        },
        medusa: () => {
          const pulse = Math.sin(t * 2 + swimmer.phase);
          swimmer.group.position.set(x, swimmer.depth + Math.sin(t * 0.5 + swimmer.phase) * 0.5 + Math.max(pulse, 0) * 0.15, z);
          swimmer.group.scale.set(1 + pulse * 0.08, 1 - pulse * 0.08, 1 + pulse * 0.08);
          swimmer.parts.forEach((tentacle, index) => {
            tentacle.rotation.z = Math.sin(t * 1.5 + index) * 0.25;
          });
        },
        cangrejo: () => {
          swimmer.group.position.set(x, swimmer.depth + Math.abs(Math.sin(t * 10 + swimmer.phase)) * 0.02, z);
          swimmer.group.rotation.y = -angle;
          swimmer.parts.forEach((claw, index) => {
            claw.rotation.z = Math.sin(t * 3 + index) * 0.3;
          });
        },
      };
      animations[swimmer.kind]();
    });
    this.octopusArms.forEach((arm, index) => {
      arm.rotation.z = Math.sin(t * 1.2 + index * 0.8) * 0.2;
    });
  }

  private swim(kind: Swimmer["kind"], built: { group: Group; parts: Group[] }, island: IslandCircle, distance: number, depth: number, speed: number, rng: SeededRandom): void {
    this.group.add(built.group);
    this.swimmers.push({ kind, group: built.group, parts: built.parts, island, distance, depth, speed: speed * rng.between(0.8, 1.2), phase: rng.between(0, Math.PI * 2) });
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.6, map: SeaTextures.speckle() });
    this.materials.set(color, created);
    return created;
  }

  private blob(parent: Group, color: number | MeshStandardMaterial, at: [number, number, number], scale: [number, number, number], geometry: BufferGeometry = this.ball): Mesh {
    const mesh = new Mesh(geometry, typeof color === "number" ? this.material(color) : color);
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  private turtle(): { group: Group; parts: Group[] } {
    const group = new Group();
    this.blob(group, 0x8a5a2c, [0, 0, 0], [0.55, 0.28, 0.45]);
    this.blob(group, 0xa8733a, [0, 0.12, 0], [0.32, 0.16, 0.26]);
    this.blob(group, 0x6fbf73, [0.62, 0.02, 0], [0.18, 0.15, 0.15]);
    this.blob(group, 0x2a1730, [0.74, 0.08, 0.08], [0.03, 0.03, 0.03]);
    this.blob(group, 0x2a1730, [0.74, 0.08, -0.08], [0.03, 0.03, 0.03]);
    const parts = [
      [0.3, 0.4],
      [0.3, -0.4],
      [-0.3, 0.35],
      [-0.3, -0.35],
    ].map(([x, z]) => {
      const flipper = new Group();
      this.blob(flipper, 0x6fbf73, [0, 0, (z as number) * 0.4], [0.28, 0.05, 0.14]);
      flipper.position.set(x as number, -0.04, z as number);
      group.add(flipper);
      return flipper;
    });
    return { group, parts };
  }

  private manta(): { group: Group; parts: Group[] } {
    const group = new Group();
    const material = new MeshStandardMaterial({ color: 0x4a5a8a, roughness: 0.6, side: DoubleSide, map: SeaTextures.belly() });
    this.blob(group, material, [0, 0, 0], [0.5, 0.1, 0.32]);
    const wing = new Shape();
    wing.moveTo(0, 0);
    wing.quadraticCurveTo(0.3, 0.9, -0.1, 1.2);
    wing.quadraticCurveTo(-0.3, 0.6, -0.5, 0);
    wing.closePath();
    const wingGeometry = new ShapeGeometry(wing, 8).rotateX(Math.PI / 2);
    const parts = [1, -1].map((side) => {
      const pivot = new Group();
      const blade = new Mesh(wingGeometry, material);
      blade.scale.set(1, 1, side);
      pivot.add(blade);
      group.add(pivot);
      return pivot;
    });
    const tail = new Mesh(new CapsuleGeometry(0.012, 0.9, 3, 4), material);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.85;
    group.add(tail);
    group.scale.setScalar(1.4);
    return { group, parts };
  }

  private jelly(color: number): { group: Group; parts: Group[] } {
    const group = new Group();
    const glow = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, transparent: true, opacity: 0.75, roughness: 0.2, depthWrite: false });
    this.jellyGlow.push(glow);
    this.blob(group, glow, [0, 0, 0], [0.32, 0.26, 0.32], new SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2));
    const tentacle = new CapsuleGeometry(0.02, 0.7, 3, 4);
    const parts = Array.from({ length: 5 }, (_, index) => {
      const pivot = new Group();
      const strand = new Mesh(tentacle, glow);
      strand.position.y = -0.38;
      pivot.add(strand);
      const angle = (index / 5) * Math.PI * 2;
      pivot.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
      group.add(pivot);
      return pivot;
    });
    return { group, parts };
  }

  private crab(): { group: Group; parts: Group[] } {
    const group = new Group();
    this.blob(group, 0xff4f5b, [0, 0.06, 0], [0.14, 0.07, 0.1]);
    [-1, 1].forEach((side) => {
      this.blob(group, 0x2a1730, [0.05, 0.14, side * 0.05], [0.02, 0.02, 0.02]);
      for (let leg = 0; leg < 3; leg += 1) this.blob(group, 0xff6f6f, [-0.06 + leg * 0.06, 0.02, side * 0.12], [0.015, 0.015, 0.06]);
    });
    const parts = [-1, 1].map((side) => {
      const claw = new Group();
      this.blob(claw, 0xff4f5b, [0.06, 0, 0], [0.06, 0.04, 0.05]);
      claw.position.set(0.13, 0.08, side * 0.08);
      group.add(claw);
      return claw;
    });
    group.scale.setScalar(1.6);
    return { group, parts };
  }

  private octopus(island: IslandCircle, rng: SeededRandom): Group {
    const group = new Group();
    this.blob(group, 0xb98cf0, [0, 0.5, 0], [0.4, 0.5, 0.38]);
    [-1, 1].forEach((side) => {
      this.blob(group, 0xfffaf2, [0.3, 0.6, side * 0.14], [0.09, 0.09, 0.09]);
      this.blob(group, 0x2a1730, [0.36, 0.6, side * 0.15], [0.045, 0.045, 0.045]);
    });
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const arm = new Group();
      const curve = new CatmullRomCurve3([new Vector3(0, 0.1, 0), new Vector3(0.4, 0.02, 0), new Vector3(0.75, 0.08, 0.1), new Vector3(0.85, 0.25, -0.05)]);
      arm.add(new Mesh(new TubeGeometry(curve, 12, 0.05, 6), this.material(0xb98cf0)));
      arm.rotation.y = angle;
      this.octopusArms.push(arm);
      group.add(arm);
    }
    const angle = rng.between(0, Math.PI * 2);
    group.position.set(island.x + Math.cos(angle) * island.radius * 1.2, CORAL_SHELF_Y, island.z + Math.sin(angle) * island.radius * 1.2);
    group.scale.setScalar(0.7);
    return group;
  }
}
