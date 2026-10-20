import { Group, Vector3, type MeshStandardMaterial } from "three";
import { CAR_DECK_WIDTH, TRAVELERS_MAX, WALKERS_PER_LINK } from "../../../constantes/barrio_constantes.js";
import { BearBuilder } from "../BearBuilder.js";
import type { WalkGap } from "../walk/WalkArea.js";
import { DECK_TOP } from "./ArchBridge.js";
import { BalloonHop } from "./BalloonHop.js";
import { Boardwalk, BOARD_DECK_WIDTH } from "./Boardwalk.js";
import { CarBridge } from "./CarBridge.js";
import { Gondola } from "./Gondola.js";
import type { NightLights } from "./NightLights.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import { OUTPOST_RADIUS } from "./Outpost.js";
import { RaftFerry } from "./RaftFerry.js";
import { RopeBridge, ROPE_DECK_WIDTH } from "./RopeBridge.js";
import { TravelerBear, type TravelPose } from "./TravelerBear.js";
import { Zipline } from "./Zipline.js";
import { MeshMerger } from "../MeshMerger.js";

export interface WalkableLink {
  group: Group;
  lamps: MeshStandardMaterial[];
  path: (u: number) => Vector3;
}

export interface TravelLink {
  group: Group;
  lamps: MeshStandardMaterial[];
  update: (elapsed: number, night: number, moving: boolean) => void;
  trail?: () => Vector3;
}

export type RiderFactory = (pose: TravelPose, scale?: number) => TravelerBear | null;

export interface LinkIsland {
  x: number;
  z: number;
  radius: number;
  gaps: number[];
}

export interface CarLink {
  a: number;
  b: number;
  angleA: number;
  angleB: number;
}

export interface SeaSegment {
  from: Vector3;
  to: Vector3;
}

type Contraption = "gondola" | "zipline" | "raft" | "balloon";
type LinkKind = Contraption | "car" | "rope" | "boardwalk";

interface LinkSpec {
  kind: LinkKind;
  a: LinkIsland;
  angleA: number;
  b: LinkIsland;
  angleB: number;
  seed: number;
}

interface Walker {
  bear: TravelerBear;
  path: (u: number) => Vector3;
  speed: number;
  phase: number;
}

const ARCH_OVERLAP = 0.5;
const ANCHOR_INSET: Record<LinkKind, number> = { gondola: 1.2, zipline: 1.2, raft: -1.1, balloon: 1.6, car: ARCH_OVERLAP, rope: ARCH_OVERLAP, boardwalk: ARCH_OVERLAP };
const BALLOON_STRIPES = [
  ["#ff8fb7", "#fff6dc"],
  ["#7fd0ea", "#ffe35c"],
  ["#b89cf2", "#fffaf2"],
] as const;

export class IslandLinks {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  readonly gaps: WalkGap[] = [];
  readonly segments: SeaSegment[] = [];
  private readonly specs: LinkSpec[] = [];
  private readonly travels: TravelLink[] = [];
  private readonly walkers: Walker[] = [];
  private readonly bears = new BearBuilder();
  private readonly anchors = new Map<LinkIsland, number[]>();
  private riders = 0;
  private particles: ParticleSystem | null = null;

  /**
   * Conexiones entre las islas, distintas de los puentes de arco. Entre la isla principal y cada hermana va un puente
   * rígido ancho para carros (de piedra o de madera) que sale del lote libre de cada anillo; a sus lados, en los
   * huecos entre casas, una pasarela de peatones (puente colgante o de madera sobre pilotes) y dos atracciones
   * (teleférico, tirolesa, balsa con cuerda o globo viajero). Hacia las islitas de los puentes de arco hay además
   * tirolesa, balsa y globo. Ositos guardianes cruzan caminando o van en ellos de ida y vuelta.
   *
   * @param islands - Islas del archipiélago con los huecos entre lotes de su orilla; la primera es la principal.
   * @param carLinks - Puentes de carros entre islas, con el ángulo de su lote libre en cada una.
   * @param outposts - Centros de las islitas de los puentes de arco.
   * @param bridges - Puentes de piedra sueltos, sin atracciones al lado (por ejemplo hacia la isla del castillo).
   */
  constructor(
    private readonly islands: LinkIsland[],
    carLinks: CarLink[],
    outposts: { x: number; z: number }[],
    bridges: CarLink[] = [],
  ) {
    const main = islands[0] as LinkIsland;
    carLinks.forEach((link, index) => {
      const a = islands[link.a] as LinkIsland;
      const b = islands[link.b] as LinkIsland;
      const kinds: [Contraption, Contraption] = index % 2 === 0 ? ["gondola", "raft"] : ["zipline", "balloon"];
      this.add("car", a, link.angleA, b, link.angleB, index);
      this.add(index % 2 === 0 ? "rope" : "boardwalk", a, this.gap(a, link.angleA, 1, 0), b, this.gap(b, link.angleB, -1, 0), index);
      this.add(kinds[0], a, this.gap(a, link.angleA, -1, 0), b, this.gap(b, link.angleB, 1, 0), index);
      this.add(kinds[1], a, this.gap(a, link.angleA, 1, 1), b, this.gap(b, link.angleB, -1, 1), index);
    });
    bridges.forEach((link) => this.add("car", islands[link.a] as LinkIsland, link.angleA, islands[link.b] as LinkIsland, link.angleB, 0));
    const outpostKinds: Contraption[] = ["zipline", "raft", "balloon"];
    outposts.forEach((spot, index) => {
      const toward = Math.atan2(spot.z - main.z, spot.x - main.x);
      const side = index % 2 === 0 ? 1 : -1;
      const islet: LinkIsland = { x: spot.x, z: spot.z, radius: OUTPOST_RADIUS, gaps: [] };
      this.add(outpostKinds[index % outpostKinds.length] as Contraption, main, this.gap(main, toward, side, 0), islet, toward + Math.PI - side * 0.75, 10 + index);
      this.segments.push({ from: IslandLinks.rim(main, toward, 0), to: IslandLinks.rim(islet, toward + Math.PI, 0) });
    });
  }

  /**
   * @param index - Posición de la isla en la lista.
   * @returns Ángulos (desde el centro de la isla) donde llegan conexiones; ahí no se ponen árboles ni hongos.
   */
  clearAngles(index: number): number[] {
    return this.anchors.get(this.islands[index] as LinkIsland) ?? [];
  }

  /**
   * Arma todas las conexiones y sus ositos. Se llama una sola vez, después de consultar los ángulos libres.
   *
   * @param archPaths - Caminos de los puentes de arco ya construidos, para que también los crucen ositos.
   * @param lights - Luces de la noche, para los halos y guirnaldas de los puentes de carros.
   * @param particles - Partículas, para las estelas de luz de globos y tirolesas.
   */
  build(archPaths: ((u: number) => Vector3)[], lights: NightLights, particles: ParticleSystem): void {
    this.particles = particles;
    const rider: RiderFactory = (pose, scale) => this.rider(pose, scale);
    const walkable = (spec: LinkSpec, from: Vector3, to: Vector3): WalkableLink | null => {
      const makers: Partial<Record<LinkKind, () => WalkableLink>> = {
        car: () => new CarBridge().build(from, to, spec.seed % 2 === 1, lights, `puente-${spec.seed}`),
        rope: () => new RopeBridge().build(from, to, `colgante-${spec.seed}`),
        boardwalk: () => new Boardwalk().build(from, to),
      };
      return makers[spec.kind]?.() ?? null;
    };
    const widths: Partial<Record<LinkKind, number>> = { car: CAR_DECK_WIDTH, rope: ROPE_DECK_WIDTH, boardwalk: BOARD_DECK_WIDTH };
    this.specs.forEach((spec) => {
      const from = IslandLinks.rim(spec.a, spec.angleA, -ANCHOR_INSET[spec.kind]).setY(spec.kind === "raft" ? 0 : DECK_TOP);
      const to = IslandLinks.rim(spec.b, spec.angleB, -ANCHOR_INSET[spec.kind]).setY(spec.kind === "raft" ? 0 : DECK_TOP);
      const built = walkable(spec, from, to);
      const width = widths[spec.kind];
      if (built && width) {
        const half = width / 2 + 0.45;
        const edgeA = IslandLinks.rim(spec.a, spec.angleA, 0);
        const edgeB = IslandLinks.rim(spec.b, spec.angleB, 0);
        this.gaps.push({ x: edgeA.x, z: edgeA.z, half }, { x: edgeB.x, z: edgeB.z, half });
        this.group.add(MeshMerger.merge(built.group));
        this.lamps.push(...built.lamps);
        this.addWalkers(built.path);
        return;
      }
      this.contraption(spec.kind as Contraption, from, to, rider, spec.seed);
    });
    archPaths.forEach((path) => this.addWalkers(path));
  }

  /**
   * Anima las góndolas, tirolesas, balsas y globos, y hace caminar a los ositos de ida y vuelta por los puentes.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.travels.forEach((travel) => travel.update(elapsed, night, moving));
    this.walkers.forEach((walker) => {
      const wave = t * walker.speed + walker.phase;
      const u = 0.04 + 0.92 * (0.5 - 0.5 * Math.cos(wave));
      const ahead = Math.sin(wave) >= 0 ? 1 : -1;
      const here = walker.path(u);
      const next = walker.path(Math.min(Math.max(u + ahead * 0.01, 0), 1));
      walker.bear.group.position.copy(here);
      walker.bear.group.rotation.y = Math.atan2(next.x - here.x, next.z - here.z);
      walker.bear.update(elapsed, moving);
    });
  }

  private add(kind: LinkKind, a: LinkIsland, angleA: number, b: LinkIsland, angleB: number, seed: number): void {
    this.specs.push({ kind, a, angleA, b, angleB, seed });
    [
      [a, angleA],
      [b, angleB],
    ].forEach(([island, angle]) => this.anchors.set(island as LinkIsland, [...(this.anchors.get(island as LinkIsland) ?? []), angle as number]));
    this.segments.push({ from: IslandLinks.rim(a, angleA, 0), to: IslandLinks.rim(b, angleB, 0) });
  }

  private gap(island: LinkIsland, angle: number, side: 1 | -1, rank: number): number {
    const diff = (other: number): number => Math.atan2(Math.sin(other - angle), Math.cos(other - angle));
    const candidates = island.gaps.filter((other) => Math.sign(diff(other)) === side && Math.abs(diff(other)) > 0.05).sort((x, y) => Math.abs(diff(x)) - Math.abs(diff(y)));
    const used = this.anchors.get(island) ?? [];
    const free = candidates.filter((other) => used.every((taken) => Math.abs(Math.atan2(Math.sin(other - taken), Math.cos(other - taken))) > 0.05));
    return free[rank] ?? free[0] ?? angle + side * (2.6 * (rank + 1)) / Math.max(island.radius, 1);
  }

  private rider(pose: TravelPose, scale = 0.3): TravelerBear | null {
    if (this.riders >= TRAVELERS_MAX) return null;
    this.riders += 1;
    return new TravelerBear(this.bears, this.riders * 3 + 1, pose, scale);
  }

  private addWalkers(path: (u: number) => Vector3): void {
    for (let index = 0; index < WALKERS_PER_LINK; index += 1) {
      const bear = this.rider("camina", 0.28);
      if (!bear) return;
      this.group.add(bear.group);
      this.walkers.push({ bear, path, speed: 0.09 + index * 0.02, phase: index * Math.PI + this.walkers.length * 1.3 });
    }
  }

  private contraption(kind: Contraption, from: Vector3, to: Vector3, rider: RiderFactory, seed: number): void {
    const makers: Record<Contraption, () => TravelLink> = {
      gondola: () => new Gondola().build(from, to, rider),
      zipline: () => new Zipline().build(from, to, rider),
      raft: () => new RaftFerry().build(from, to, rider),
      balloon: () => new BalloonHop().build(from, to, rider, BALLOON_STRIPES[seed % BALLOON_STRIPES.length] as readonly string[]),
    };
    const link = makers[kind]();
    if (link.trail && this.particles) this.particles.addStream({ kind: "estela", rate: 12, spread: 0.05, at: link.trail });
    this.group.add(link.group);
    this.lamps.push(...link.lamps);
    this.travels.push(link);
  }

  private static rim(island: LinkIsland, angle: number, beyond: number): Vector3 {
    const distance = island.radius + beyond;
    return new Vector3(island.x + Math.cos(angle) * distance, 0, island.z + Math.sin(angle) * distance);
  }
}
