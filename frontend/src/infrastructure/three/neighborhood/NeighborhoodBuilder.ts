import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import {
  CARS_PER_ISLAND_MAX,
  CIVIC_KINDS,
  CIVIC_PER_ISLAND,
  GIANT_TREE_CLEARANCE,
  GIANT_TREE_SPACING,
  GIANT_TREES_PER_ISLAND,
  MUSHROOM_CLUSTERS_PER_ISLAND,
  OUTPOST_ANGLE,
  FOLK_MAX,
  FOLK_PER_ISLAND,
  SHOPPERS_MAX,
  THEME_CIVIC,
  TOUR_CARS_PER_LINK,
  TOUR_VEHICLES,
} from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { BearBuilder } from "../BearBuilder.js";
import type { WalkGap, WalkZone } from "../walk/WalkArea.js";
import { ArchipelagoLayout, CASTLE_PARTNER, type IslandPlan, type IslandTheme } from "./ArchipelagoLayout.js";
import { BearBudget } from "./BearBudget.js";
import { CastleIsland } from "./CastleIsland.js";
import { CommerceDistrict } from "./CommerceDistrict.js";
import { HarborPier } from "./HarborPier.js";
import { IslandFolk, type FolkRole } from "./IslandFolk.js";
import { ParticleSystem } from "./ParticleSystem.js";
import { SkyReceiver } from "./SkyReceiver.js";
import { WaveGreeter } from "./WaveGreeter.js";
import { DECK_TOP } from "./ArchBridge.js";
import { Backdrop } from "./Backdrop.js";
import { BridgeLinks } from "./BridgeLinks.js";
import { Butterflies } from "./Butterflies.js";
import { CivicBuildings, type CivicKind } from "./CivicBuildings.js";
import { DayLife } from "./DayLife.js";
import { DuckFlock } from "./DuckFlock.js";
import { GiantTreeBuilder } from "./GiantTreeBuilder.js";
import { GuardianBear } from "./GuardianBear.js";
import { HouseFactory } from "./HouseFactory.js";
import { HouseLife, type SmokePuff } from "./HouseLife.js";
import { IslandBuilder } from "./IslandBuilder.js";
import { IslandLinks, type CarLink } from "./IslandLinks.js";
import { LighthouseBeam } from "./LighthouseBeam.js";
import { NightLights } from "./NightLights.js";
import { SeaRoutes } from "./SeaRoutes.js";
import { SeaTraffic } from "./SeaTraffic.js";
import { SeaFloor } from "./SeaFloor.js";
import { ReefGarden } from "./ReefGarden.js";
import { FishSchools } from "./FishSchools.js";
import { SeaCreatures } from "./SeaCreatures.js";
import { SurfaceLife } from "./SurfaceLife.js";
import { TrafficSignal } from "./TrafficSignal.js";
import { LeapingFish } from "./LeapingFish.js";
import { MushroomBuilder } from "./MushroomBuilder.js";
import { OUTPOST_RADIUS } from "./Outpost.js";
import { PetAnimals } from "./PetAnimals.js";
import { GrassField } from "../GrassField.js";
import type { LotSlot } from "./RingLayout.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import { Sparkles, type IslandCircle } from "./Sparkles.js";
import { StreetFurniture } from "./StreetFurniture.js";
import { Traffic } from "./Traffic.js";
import { TreeFactory } from "./TreeFactory.js";
import { YardDetails } from "./YardDetails.js";
import { Solid } from "../walk/Solid.js";
import { MeshMerger } from "../MeshMerger.js";

export interface MapCategory {
  id: number;
  name: string;
  count: number;
}

export interface HouseEntry {
  id: number;
  name: string;
  count: number;
  group: Group;
  glass: MeshStandardMaterial;
  door: Group;
  smoke: SmokePuff[];
  stars: Mesh[];
  bear: GuardianBear;
  baseY: number;
  height: number;
  templateId: string;
}

export interface Animated {
  update(elapsed: number, night: number, moving: boolean): void;
}

interface IslandKit {
  lights: NightLights;
  animated: Animated[];
  spurs: Map<string, Spur>;
  particles: ParticleSystem;
  shoppers: BearBudget;
  folk: BearBudget;
}

const FOLK_SPACING = 2.6;
const FOLK_ROLES: Record<IslandTheme, FolkRole[]> = {
  comercio: ["paseo", "charla", "paseo"],
  servicios: ["paseo", "jardinero", "charla"],
  parque: ["pelota", "cometa", "pelota", "paseo"],
  granja: ["granja", "tendedero", "jardinero", "granja"],
  puerto: ["paseo", "charla", "tendedero"],
};

interface Spur {
  curve: CatmullRomCurve3;
  at: number;
  point: Vector3;
  rim: Vector3;
}

export interface NeighborhoodWorld {
  world: Group;
  houses: HouseEntry[];
  swaying: Group[];
  lamps: MeshStandardMaterial[];
  traffic: Traffic;
  dayLife: DayLife;
  backdrop: Backdrop;
  radius: number;
  zones: WalkZone[];
  gaps: WalkGap[];
  extras?: Animated[];
}

export const ROAD_WIDTH = 1.6;
const PAD_RADIUS = 1.85;
const POST = 0x6b4a6a;
const GROUND = 0.06;
const LOT_CLEARANCE = 2.5;
const ARCH_SPAN = 7.5;

export class NeighborhoodBuilder {
  private readonly rng = new SeededRandom("barrio");
  private readonly trees = new TreeFactory(this.rng);
  private readonly giants = new GiantTreeBuilder(new SeededRandom("gigantes"));
  private readonly mushrooms = new MushroomBuilder(new SeededRandom("hongos"));
  private readonly life = new HouseLife(this.rng);
  private readonly lampGlass: MeshStandardMaterial[] = [];
  private readonly padMaterials = new Map<number, MeshStandardMaterial>();
  private readonly bears = new BearBuilder();
  private readonly poleGeometry = new CylinderGeometry(0.035, 0.05, 1.45, 10);
  private readonly poleMaterial = new MeshStandardMaterial({ color: POST, roughness: 0.7 });

  /**
   * @param categories - Categorías del inventario; cada una se vuelve una casa.
   * @param factory - Fábrica de casas a partir de plantillas.
   */
  constructor(
    private readonly categories: MapCategory[],
    private readonly factory: HouseFactory = new HouseFactory(),
  ) {}

  /**
   * Arma el barrio como un archipiélago de plastilina: las categorías se reparten en una o varias islas, cada una con
   * su calle de losas en anillo, sus casas, dos edificios del pueblo, árboles gigantes y hongos de cuento. Las islas se
   * unen con puentes de carros (por donde parte del tráfico va y vuelve), pasarelas, teleféricos, tirolesas, balsas y
   * globos por donde viajan ositos; alrededor navegan barcos piratas y de puerto, y hay mascotas, patos, peces,
   * mariposas, destellos, un faro con haz giratorio y luces de noche.
   *
   * @returns El mundo 3D, las casas, el radio que abarca todo y lo que se anima aparte.
   */
  build(): NeighborhoodWorld {
    const archipelago = ArchipelagoLayout.plan(this.categories, this.rng);
    const world = new Group();
    const swaying: Group[] = [];
    const houses: HouseEntry[] = [];
    const animated: Animated[] = [];
    const main = archipelago.islands[0] as IslandPlan;
    const lights = new NightLights(main.x, main.z, main.plan.islandRadius);
    const circles: IslandCircle[] = archipelago.islands.map((island) => ({ x: island.x, z: island.z, radius: island.plan.islandRadius }));
    const castlePlan = archipelago.castle;
    const seaCircles: IslandCircle[] = [...circles, { x: castlePlan.x, z: castlePlan.z, radius: castlePlan.radius }];
    const particles = new ParticleSystem(seaCircles);
    const shoppers = new BearBudget(SHOPPERS_MAX);
    const folk = new BearBudget(FOLK_MAX);
    const anchor = archipelago.islands[castlePlan.anchor] as IslandPlan;
    const castleIndex = archipelago.islands.length;
    const carLinks: CarLink[] = archipelago.islands.slice(1).map((island) => ({
      a: 0,
      b: island.index,
      angleA: main.junctions.find((junction) => junction.partner === island.index)?.angle ?? 0,
      angleB: island.junctions[0]?.angle ?? 0,
    }));
    const links = new IslandLinks(
      [...archipelago.islands.map((island) => ({ x: island.x, z: island.z, radius: island.plan.islandRadius, gaps: island.gapAngles })), { x: castlePlan.x, z: castlePlan.z, radius: castlePlan.radius, gaps: [] }],
      carLinks,
      archipelago.outposts,
      [{ a: castlePlan.anchor, b: castleIndex, angleA: anchor.junctions.find((junction) => junction.partner === CASTLE_PARTNER)?.angle ?? 0, angleB: castlePlan.angle }],
    );
    const spurs = new Map<string, Spur>();
    archipelago.islands.forEach((island) => {
      const built = this.island(world, island, links.clearAngles(island.index), { lights, animated, spurs, particles, shoppers, folk });
      swaying.push(...built.swaying);
      houses.push(...built.houses);
    });

    const bridges = new BridgeLinks(this.trees).build(main.plan.islandRadius, main.x, main.z);
    links.build(this.archPaths(main), lights, particles);
    const castle = new CastleIsland(castlePlan, this.rng, this.trees, lights, particles);
    swaying.push(...castle.swaying);
    world.updateMatrixWorld(true);
    const tours = carLinks.flatMap((link) => {
      const from = spurs.get(`${link.a}-${link.b}`);
      const to = spurs.get(`${link.b}-${link.a}`);
      return from && to ? [{ curve: NeighborhoodBuilder.tourRoute(from, to), cars: TOUR_CARS_PER_LINK, kinds: TOUR_VEHICLES, oneWay: true }] : [];
    });
    const traffic = new Traffic(
      [
        ...archipelago.islands.map((island) => ({ curve: island.plan.curve, cars: Math.min(Math.max(Math.round((island.categories.length + CIVIC_PER_ISLAND) / 3) + 1, 2), CARS_PER_ISLAND_MAX) })),
        ...tours,
      ],
      ROAD_WIDTH,
    );
    const extent = archipelago.radius;
    const dayLife = new DayLife(extent * 2, extent * 2);
    const backdrop = new Backdrop(extent, this.categories.map((category) => category.id), this.trees);
    const sparkles = new Sparkles(seaCircles);
    const butterflies = new Butterflies(seaCircles);
    const pets = new PetAnimals(archipelago.islands.map((island) => island.plan.curve), ROAD_WIDTH);
    const ducks = new DuckFlock(circles);
    const fish = new LeapingFish(seaCircles, particles);
    const beam = new LighthouseBeam(this.lighthouse(main));
    const routes = SeaRoutes.plan([...seaCircles, ...archipelago.outposts.map((spot) => ({ x: spot.x, z: spot.z, radius: OUTPOST_RADIUS }))], links.segments, extent);
    const sea = new SeaTraffic(routes.orbit, routes.loops, particles);
    const floor = new SeaFloor(seaCircles, extent * 3.2);
    const reef = new ReefGarden(seaCircles);
    const schools = new FishSchools(seaCircles);
    const creatures = new SeaCreatures(seaCircles);
    const routePoints = [routes.orbit, ...routes.loops.map((loop) => loop.curve)].flatMap((curve) => curve.getSpacedPoints(60));
    const surface = new SurfaceLife(seaCircles, links.segments, routePoints, extent, particles);
    const rainbowDust = new Vector3();
    let rainbowTurn = 0;
    particles.addStream({
      kind: "hada",
      rate: 10,
      spread: 0.6,
      at: () => {
        rainbowTurn = (rainbowTurn + 0.37) % Math.PI;
        const reach = extent * 1.75;
        return rainbowDust.set(Math.cos(rainbowTurn) * reach, -1.35 + Math.sin(rainbowTurn) * reach, -extent * 2.6);
      },
    });
    world.add(backdrop.group, traffic.group, dayLife.group, bridges.group, links.group, sparkles.group, butterflies.group, pets.group, ducks.group, fish.group, lights.group, beam.group, sea.group, floor.group, reef.group, schools.mesh, creatures.group, surface.group, castle.group, particles.group);
    this.lampGlass.push(...bridges.lamps, ...links.lamps, ...this.mushrooms.glows, ...sea.lanterns, ...castle.lamps);
    const waving = new WaveGreeter(houses.map((house) => house.bear), traffic.cars);
    const zones: WalkZone[] = [
      ...bridges.zones,
      ...archipelago.islands.slice(1).map((island) => ({ x: island.x, z: island.z, radius: island.plan.islandRadius })),
      { x: castlePlan.x, z: castlePlan.z, radius: castlePlan.radius },
    ];
    return {
      world,
      houses,
      swaying,
      lamps: this.lampGlass,
      traffic,
      dayLife,
      backdrop,
      radius: extent,
      zones,
      gaps: [...bridges.gaps, ...links.gaps],
      extras: [links, sparkles, butterflies, pets, ducks, fish, lights, beam, sea, floor, reef, schools, creatures, surface, castle, waving, ...animated, particles],
    };
  }

  private lighthouse(main: IslandPlan): Vector3 {
    const distance = main.plan.islandRadius + ARCH_SPAN + OUTPOST_RADIUS - 1;
    return new Vector3(main.x + Math.cos(OUTPOST_ANGLE) * distance - 0.4, DECK_TOP + 3.6, main.z + Math.sin(OUTPOST_ANGLE) * distance - 0.2);
  }

  private static tourRoute(a: Spur, b: Spur): CatmullRomCurve3 {
    const points: Vector3[] = [a.point.clone()];
    const ring = (spur: Spur): void => {
      const steps = Math.ceil(spur.curve.getLength() / 0.9);
      for (let step = 1; step < steps; step += 1) points.push(spur.curve.getPointAt((spur.at + step / steps) % 1).setY(0));
      points.push(spur.point.clone());
    };
    const line = (from: Vector3, to: Vector3): void => {
      const steps = Math.max(Math.ceil(from.distanceTo(to) / 0.9), 1);
      for (let step = 1; step <= steps; step += 1) points.push(from.clone().lerp(to, step / steps));
    };
    ring(a);
    line(a.point, a.rim);
    line(a.rim, b.rim);
    line(b.rim, b.point);
    ring(b);
    line(b.point, b.rim);
    line(b.rim, a.rim);
    line(a.rim, a.point);
    points.pop();
    return new CatmullRomCurve3(points, true, "centripetal");
  }

  private island(world: Group, island: IslandPlan, linkAngles: number[], kit: IslandKit): { swaying: Group[]; houses: HouseEntry[] } {
    const { lights, animated, spurs, particles } = kit;
    const pierAngle = island.themes.includes("puerto") ? NeighborhoodBuilder.pierAngle(island, linkAngles) : null;
    const clear = pierAngle === null ? linkAngles : [...linkAngles, pierAngle];
    const { plan } = island;
    const built = new IslandBuilder(this.rng, this.trees).build(plan.islandRadius, plan.plazaRadius, clear);
    built.group.position.set(island.x, 0, island.z);
    const swaying = [...built.swaying];
    const crossings = [0.12, 0.62].map((at) => at + this.rng.between(-0.04, 0.04));
    const mine = island.junctions.map((junction) => this.spur(world, island, junction.angle, junction.slot, lights, animated));
    island.junctions.forEach((junction, index) => spurs.set(`${island.index}-${junction.partner}`, mine[index] as Spur));
    const segments = mine.map((spur) => ({ from: spur.point, to: spur.rim }));
    world.add(
      this.grass(island, segments),
      built.group,
      new RoadBuilder().build(plan.curve, ROAD_WIDTH, crossings, `camino-${island.index}`),
      MeshMerger.merge(new StreetFurniture().build(plan.curve, ROAD_WIDTH, [...crossings, ...mine.map((spur) => spur.at)])),
      MeshMerger.merge(this.lamps(plan.curve, plan.curve.getLength(), lights, mine.map((spur) => spur.at))),
    );
    const houses = island.categories.map((category, index) => this.lot(world, category, island.houseSlots[index] as LotSlot));
    const pool = island.themes.flatMap((theme) => THEME_CIVIC[theme]);
    island.civicSlots.forEach((slot, index) => this.civic(world, (pool[index % Math.max(pool.length, 1)] ?? CIVIC_KINDS[index % CIVIC_KINDS.length]) as CivicKind, slot, island.index * 7 + index, lights, particles));
    this.themed(world, island, pierAngle, kit);
    this.looseTrees(island, segments).forEach((tree) => {
      world.add(tree);
      swaying.push(tree);
    });
    const spots = this.openSpots(island, clear, segments);
    spots.slice(0, GIANT_TREES_PER_ISLAND).forEach((spot) => {
      const tree = this.giants.build(spot.x, spot.z, this.rng.between(0.85, 1.1));
      world.add(tree);
      swaying.push(tree);
    });
    spots.slice(GIANT_TREES_PER_ISLAND, GIANT_TREES_PER_ISLAND + MUSHROOM_CLUSTERS_PER_ISLAND).forEach((spot) => world.add(this.mushrooms.cluster(spot.x, spot.z, this.rng.between(0.9, 1.2))));
    const taken = spots.slice(0, GIANT_TREES_PER_ISLAND + MUSHROOM_CLUSTERS_PER_ISLAND);
    const folkSpots = this.openSpots(island, clear, segments, plan.islandRadius - 1.5, FOLK_SPACING, 2.0).filter((spot) => taken.every((other) => Math.hypot(other.x - spot.x, other.z - spot.z) > 2.2));
    const roles = island.themes.flatMap((theme) => FOLK_ROLES[theme]).slice(0, Math.max(FOLK_PER_ISLAND, island.themes.length * 2));
    const people = new IslandFolk(folkSpots, roles, kit.folk, particles, island.index * 11 + 3);
    world.add(people.group);
    animated.push(people);
    return { swaying, houses };
  }

  private static pierAngle(island: IslandPlan, clear: number[]): number {
    const distance = (angle: number): number => Math.min(Math.PI, ...clear.map((spot) => Math.abs(Math.atan2(Math.sin(angle - spot), Math.cos(angle - spot)))));
    return island.gapAngles.reduce((best, gap) => (distance(gap) > distance(best) ? gap : best), island.gapAngles[0] ?? 0);
  }

  private themed(world: Group, island: IslandPlan, angle: number | null, kit: IslandKit): void {
    const { lights, animated, particles } = kit;
    if (island.commerceSlots.length === 3) {
      const district = new CommerceDistrict(island.commerceSlots, island.index * 5, island.index === 0, kit.shoppers, lights, particles);
      this.lampGlass.push(...district.lamps);
      world.add(district.group);
      animated.push(district);
    }
    if (island.receiverSlot) {
      const receiver = new SkyReceiver(island.index * 3 + 1, particles);
      receiver.group.position.set(island.receiverSlot.x, 0.0, island.receiverSlot.z);
      receiver.group.rotation.y = island.receiverSlot.yaw;
      this.lampGlass.push(...receiver.lamps);
      world.add(receiver.group);
      animated.push(receiver);
    }
    if (angle === null) return;
    const pier = new HarborPier(island.index, lights);
    pier.group.position.set(island.x + Math.cos(angle) * (island.plan.islandRadius - 0.4), 0, island.z + Math.sin(angle) * (island.plan.islandRadius - 0.4));
    pier.group.rotation.y = -angle;
    this.lampGlass.push(...pier.lamps);
    world.add(pier.group);
    animated.push(pier);
  }

  private spur(world: Group, island: IslandPlan, angle: number, slot: LotSlot, lights: NightLights, animated: Animated[]): Spur {
    const curve = island.plan.curve;
    let at = 0;
    let nearest = Infinity;
    for (let step = 0; step < 360; step += 1) {
      const point = curve.getPointAt(step / 360);
      const distance = (point.x - slot.x) ** 2 + (point.z - slot.z) ** 2;
      if (distance >= nearest) continue;
      nearest = distance;
      at = step / 360;
    }
    const point = curve.getPointAt(at).setY(0);
    const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
    const rim = new Vector3(island.x, 0, island.z).addScaledVector(direction, island.plan.islandRadius - 0.5);
    const start = point.clone().addScaledVector(direction, ROAD_WIDTH / 2 + 0.05);
    world.add(new RoadBuilder().spur(new LineCurve3(start, rim), ROAD_WIDTH, `enlace-${island.index}-${angle.toFixed(2)}`));
    const signal = new TrafficSignal(island.index * 2.7 + angle);
    const side = new Vector3(-direction.z, 0, direction.x);
    signal.group.position.copy(point).addScaledVector(direction, ROAD_WIDTH / 2 + 0.75).addScaledVector(side, ROAD_WIDTH / 2 + 0.45).setY(GROUND);
    signal.group.rotation.y = Math.atan2(-direction.x, -direction.z);
    world.add(signal.group);
    animated.push(signal);
    return { curve, at, point, rim };
  }

  private static nearSegment(x: number, z: number, segments: { from: Vector3; to: Vector3 }[], reach: number): boolean {
    return segments.some(({ from, to }) => {
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const length = dx * dx + dz * dz;
      const t = length === 0 ? 0 : Math.min(Math.max(((x - from.x) * dx + (z - from.z) * dz) / length, 0), 1);
      return Math.hypot(x - (from.x + dx * t), z - (from.z + dz * t)) < reach;
    });
  }

  private openSpots(island: IslandPlan, clear: number[], segments: { from: Vector3; to: Vector3 }[], ring = island.plan.islandRadius - 2.0, spacing = GIANT_TREE_SPACING, clearance = GIANT_TREE_CLEARANCE): { x: number; z: number }[] {
    const { plan } = island;
    const road = plan.curve.getSpacedPoints(120);
    const slots = [...island.houseSlots, ...island.civicSlots, ...island.commerceSlots, ...(island.receiverSlot ? [island.receiverSlot] : []), ...island.junctions.map((junction) => junction.slot)];
    const spots: { x: number; z: number }[] = [];
    const offset = this.rng.between(0, Math.PI * 2);
    for (let step = 0; step < 48; step += 1) {
      const angle = offset + (step / 48) * Math.PI * 2;
      const x = island.x + Math.cos(angle) * ring;
      const z = island.z + Math.sin(angle) * ring;
      const blocked =
        clear.some((spot) => Math.abs(Math.atan2(Math.sin(angle - spot), Math.cos(angle - spot))) < 3 / plan.islandRadius) ||
        slots.some((slot) => Math.hypot(slot.x - x, slot.z - z) < clearance) ||
        road.some((point) => Math.hypot(point.x - x, point.z - z) < ROAD_WIDTH / 2 + 1.4) ||
        NeighborhoodBuilder.nearSegment(x, z, segments, ROAD_WIDTH / 2 + 2) ||
        spots.some((spot) => Math.hypot(spot.x - x, spot.z - z) < spacing);
      if (!blocked) spots.push({ x, z });
    }
    return spots;
  }

  private archPaths(main: IslandPlan): ((u: number) => Vector3)[] {
    const radius = main.plan.islandRadius;
    return [0, 1, 2].map((index) => {
      const angle = OUTPOST_ANGLE + (index / 3) * Math.PI * 2;
      const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
      const start = direction.clone().multiplyScalar(radius - 1.2).add(new Vector3(main.x, DECK_TOP, main.z));
      const end = direction.clone().multiplyScalar(radius + ARCH_SPAN + OUTPOST_RADIUS - 1 - OUTPOST_RADIUS + 0.9).add(new Vector3(main.x, DECK_TOP, main.z));
      return (u: number): Vector3 => start.clone().lerp(end, u);
    });
  }

  private grass(island: IslandPlan, segments: { from: Vector3; to: Vector3 }[]): Group {
    const { plan } = island;
    const road = plan.curve.getSpacedPoints(180);
    const clearRoad = (ROAD_WIDTH / 2 + 0.75) ** 2;
    const clearLot = LOT_CLEARANCE ** 2;
    const clearPlaza = (plan.plazaRadius + 0.3) ** 2;
    return new GrassField({
      seed: `barrio-pasto-${island.index}`,
      radius: plan.islandRadius - 0.6,
      y: GROUND - 0.01,
      center: [island.x, island.z],
      accept: (x, z) =>
        (x - island.x) ** 2 + (z - island.z) ** 2 > clearPlaza &&
        plan.slots.every((slot) => (slot.x - x) ** 2 + (slot.z - z) ** 2 > clearLot) &&
        road.every((point) => (point.x - x) ** 2 + (point.z - z) ** 2 > clearRoad) &&
        !NeighborhoodBuilder.nearSegment(x, z, segments, ROAD_WIDTH / 2 + 0.75),
    }).group;
  }

  private pad(color: number): MeshStandardMaterial {
    const cached = this.padMaterials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.8, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.35 });
    this.padMaterials.set(color, created);
    return created;
  }

  private civic(world: Group, kind: CivicKind, slot: LotSlot, seed: number, lights: NightLights, particles: ParticleSystem): void {
    if (kind === "panaderia") {
      const chimney = new Vector3(slot.x, 2.3, slot.z);
      particles.addStream({ kind: "humo", rate: 1.5, spread: 0.1, at: () => chimney });
    }
    const built = CivicBuildings.build(kind, seed);
    const pad = new Mesh(new CylinderGeometry(PAD_RADIUS, PAD_RADIUS + 0.04, 0.06, 48), this.pad(0xf6eadb));
    pad.position.set(slot.x, GROUND / 2, slot.z);
    pad.receiveShadow = true;
    built.group.position.set(slot.x, GROUND, slot.z);
    built.group.rotation.y = slot.yaw;
    Solid.mark(built.group, { shape: "box", size: [built.width * 0.85, built.height, built.depth * 0.9], offset: [0, built.height / 2, 0] });
    MeshMerger.merge(built.group);
    this.lampGlass.push(built.glass);
    built.blinkers.forEach((material) => lights.blink(material));
    world.add(pad, built.group);
  }

  private lot(world: Group, category: MapCategory, slot: LotSlot): HouseEntry {
    const built = this.factory.create(category.id);
    MeshMerger.merge(built.group, [built.door]);
    const forward = new Vector3(Math.sin(slot.yaw), 0, Math.cos(slot.yaw));

    const decor = new Group();
    decor.position.set(slot.x, 0, slot.z);
    decor.rotation.y = slot.yaw;
    const pad = new Mesh(new CylinderGeometry(PAD_RADIUS, PAD_RADIUS + 0.04, 0.06, 48), this.pad(HouseFactory.gardenColor(category.id)));
    pad.position.y = GROUND / 2;
    pad.receiveShadow = true;
    decor.add(pad, this.life.garden(category.count, HouseFactory.accentColor(category.id)));

    built.group.position.set(slot.x - forward.x * 0.2, GROUND, slot.z - forward.z * 0.2);
    built.group.rotation.y = slot.yaw;
    built.group.userData.categoryId = category.id;
    Solid.mark(built.group, { shape: "box", size: [built.width, built.height, built.depth], offset: [0, built.height / 2, 0] });
    world.add(decor, built.group);
    world.updateMatrixWorld(true);

    const doorLocal = decor.worldToLocal(built.door.getWorldPosition(new Vector3()));
    decor.add(new YardDetails(this.rng).build(doorLocal.x + 0.19, doorLocal.z, HouseFactory.accentColor(category.id)));
    MeshMerger.merge(decor);

    const bear = new GuardianBear(this.bears, category.id);
    const side = built.door.position.x >= 0 ? 1 : -1;
    bear.group.position.set(built.door.position.x + 0.19 + side * 0.95, 0, built.door.position.z + 0.9);
    bear.group.rotation.y = -side * 0.45;
    Solid.mark(bear.group, { shape: "cylinder", radius: 0.17, height: 0.8, offset: [0, 0.4, 0] });
    built.group.add(bear.group);
    return {
      id: category.id,
      name: category.name,
      count: category.count,
      group: built.group,
      glass: built.glass,
      door: built.door,
      smoke: this.life.smoke(built.group, built.chimney, category.count),
      stars: this.life.stars(built.group, category.count, built.height),
      bear,
      baseY: built.group.position.y,
      height: built.height,
      templateId: built.templateId,
    };
  }

  private looseTrees(island: IslandPlan, segments: { from: Vector3; to: Vector3 }[]): Group[] {
    const trees: Group[] = [];
    island.plan.slots.forEach((slot) => {
      if (!this.rng.chance(0.45)) return;
      const dx = slot.x - island.x;
      const dz = slot.z - island.z;
      const angle = Math.atan2(dz, dx) + 0.17;
      const distance = Math.hypot(dx, dz);
      const radius = distance + (distance > island.plan.roadRadius ? 0.5 : -0.5);
      const x = island.x + Math.cos(angle) * radius;
      const z = island.z + Math.sin(angle) * radius;
      if (NeighborhoodBuilder.nearSegment(x, z, segments, ROAD_WIDTH / 2 + 1.1)) return;
      trees.push(this.trees.build(x, z, this.rng.between(0.55, 0.85)));
    });
    return trees;
  }

  private lamps(curve: { getPointAt(at: number): Vector3 }, length: number, lights: NightLights, avoid: number[]): Group {
    const lamps = new Group();
    const count = Math.max(Math.floor(length / 6.2), 4);
    for (let index = 0; index < count; index += 1) {
      const at = index / count;
      if (avoid.some((spot) => Math.abs(Math.atan2(Math.sin((at - spot) * Math.PI * 2), Math.cos((at - spot) * Math.PI * 2))) < 0.25)) continue;
      const point = curve.getPointAt(at);
      const next = curve.getPointAt((at + 0.002) % 1);
      const tangent = next.clone().sub(point).setY(0).normalize();
      const outward = new Vector3(tangent.z, 0, -tangent.x);
      const lamp = new Group();
      const pole = new Mesh(this.poleGeometry, this.poleMaterial);
      pole.position.y = 0.72;
      pole.castShadow = true;
      const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.9 });
      this.lampGlass.push(glass);
      const bulb = new Mesh(new SphereGeometry(0.14, 14, 10), glass);
      bulb.position.y = 1.5;
      const halo = lights.halo(1.3);
      halo.position.y = 1.5;
      lamp.add(pole, bulb, halo);
      Solid.mark(lamp, { shape: "cylinder", radius: 0.07, height: 1.5, offset: [0, 0.75, 0] });
      lamp.position.set(point.x + outward.x * (ROAD_WIDTH / 2 + 0.25), GROUND, point.z + outward.z * (ROAD_WIDTH / 2 + 0.25));
      lamps.add(lamp);
    }
    return lamps;
  }
}
