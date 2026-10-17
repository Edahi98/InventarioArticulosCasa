import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { BearBuilder } from "../BearBuilder.js";
import { Backdrop } from "./Backdrop.js";
import { DayLife } from "./DayLife.js";
import { GuardianBear } from "./GuardianBear.js";
import { HouseFactory } from "./HouseFactory.js";
import { HouseLife, type SmokePuff } from "./HouseLife.js";
import { IslandBuilder } from "./IslandBuilder.js";
import { GrassField } from "../GrassField.js";
import { RingLayout, type LotSlot, type RingPlan } from "./RingLayout.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import { StreetFurniture } from "./StreetFurniture.js";
import { Traffic } from "./Traffic.js";
import { TreeFactory } from "./TreeFactory.js";
import { YardDetails } from "./YardDetails.js";

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

export interface NeighborhoodWorld {
  world: Group;
  houses: HouseEntry[];
  swaying: Group[];
  lamps: MeshStandardMaterial[];
  traffic: Traffic;
  dayLife: DayLife;
  backdrop: Backdrop;
  radius: number;
}

export const ROAD_WIDTH = 1.6;
const PAD_RADIUS = 1.85;
const POST = 0x6b4a6a;
const GROUND = 0.06;
const LOT_CLEARANCE = 2.5;

export class NeighborhoodBuilder {
  private readonly rng = new SeededRandom("barrio");
  private readonly trees = new TreeFactory(this.rng);
  private readonly life = new HouseLife(this.rng);
  private readonly lampGlass: MeshStandardMaterial[] = [];
  private readonly padMaterials = new Map<number, MeshStandardMaterial>();
  private readonly bears = new BearBuilder();

  /**
   * @param categories - Categorías del inventario; cada una se vuelve una casa.
   * @param factory - Fábrica de casas a partir de plantillas.
   */
  constructor(
    private readonly categories: MapCategory[],
    private readonly factory: HouseFactory = new HouseFactory(),
  ) {}

  /**
   * Arma el barrio como una isla de plastilina: una calle sinuosa en anillo con una casa por categoría
   * a cada lado, jardines redondos, árboles, faroles, coches y una plaza al centro.
   *
   * @returns El mundo 3D, las casas y el radio de la isla.
   */
  build(): NeighborhoodWorld {
    const count = Math.max(this.categories.length, 1);
    const plan = RingLayout.plan(count, this.rng);
    const world = new Group();
    const island = new IslandBuilder(this.rng, this.trees).build(plan.islandRadius, plan.plazaRadius);
    const swaying = [...island.swaying];
    world.add(this.grass(plan).group);
    const crossings = [0.12, 0.62].map((at) => at + this.rng.between(-0.04, 0.04));

    world.add(island.group, new RoadBuilder().build(plan.curve, ROAD_WIDTH, crossings), new StreetFurniture().build(plan.curve, ROAD_WIDTH, crossings), this.lamps(plan.curve, plan.curve.getLength()));
    const houses = this.categories.map((category, index) => this.lot(world, category, plan.slots[index] as LotSlot));
    this.looseTrees(plan.slots, plan.roadRadius).forEach((tree) => {
      world.add(tree);
      swaying.push(tree);
    });

    const traffic = new Traffic(plan.curve, ROAD_WIDTH, Math.min(Math.max(Math.round(count / 3) + 1, 2), 6));
    const dayLife = new DayLife(plan.islandRadius * 2, plan.islandRadius * 2);
    const backdrop = new Backdrop(plan.islandRadius, this.categories.map((category) => category.id), this.trees);
    world.add(backdrop.group, traffic.group, dayLife.group);
    return { world, houses, swaying, lamps: this.lampGlass, traffic, dayLife, backdrop, radius: plan.islandRadius };
  }

  private grass(plan: RingPlan): GrassField {
    const road = plan.curve.getSpacedPoints(180);
    const clearRoad = (ROAD_WIDTH / 2 + 1.1) ** 2;
    const clearLot = LOT_CLEARANCE ** 2;
    const clearPlaza = (plan.plazaRadius + 0.3) ** 2;
    return new GrassField({
      seed: "barrio-pasto",
      radius: plan.islandRadius - 0.6,
      y: GROUND - 0.01,
      accept: (x, z) =>
        x * x + z * z > clearPlaza &&
        plan.slots.every((slot) => (slot.x - x) ** 2 + (slot.z - z) ** 2 > clearLot) &&
        road.every((point) => (point.x - x) ** 2 + (point.z - z) ** 2 > clearRoad),
    });
  }

  private pad(color: number): MeshStandardMaterial {
    const cached = this.padMaterials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.8, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.35 });
    this.padMaterials.set(color, created);
    return created;
  }

  private lot(world: Group, category: MapCategory, slot: LotSlot): HouseEntry {
    const built = this.factory.create(category.id);
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
    world.add(decor, built.group);
    world.updateMatrixWorld(true);

    const doorLocal = decor.worldToLocal(built.door.getWorldPosition(new Vector3()));
    decor.add(new YardDetails(this.rng).build(doorLocal.x + 0.19, doorLocal.z, HouseFactory.accentColor(category.id)));

    const bear = new GuardianBear(this.bears, category.id);
    const side = built.door.position.x >= 0 ? 1 : -1;
    bear.group.position.set(built.door.position.x + 0.19 + side * 0.95, 0, built.door.position.z + 0.9);
    bear.group.rotation.y = -side * 0.45;
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

  private looseTrees(slots: LotSlot[], road: number): Group[] {
    const trees: Group[] = [];
    slots.forEach((slot) => {
      if (!this.rng.chance(0.45)) return;
      const angle = Math.atan2(slot.z, slot.x) + 0.17;
      const radius = Math.hypot(slot.x, slot.z) + (Math.hypot(slot.x, slot.z) > road ? 0.5 : -0.5);
      trees.push(this.trees.build(Math.cos(angle) * radius, Math.sin(angle) * radius, this.rng.between(0.55, 0.85)));
    });
    return trees;
  }

  private lamps(curve: { getPointAt(at: number): Vector3 }, length: number): Group {
    const lamps = new Group();
    const count = Math.max(Math.floor(length / 6.2), 4);
    for (let index = 0; index < count; index += 1) {
      const at = index / count;
      const point = curve.getPointAt(at);
      const next = curve.getPointAt((at + 0.002) % 1);
      const tangent = next.clone().sub(point).setY(0).normalize();
      const outward = new Vector3(tangent.z, 0, -tangent.x);
      const lamp = new Group();
      const pole = new Mesh(new CylinderGeometry(0.035, 0.05, 1.45, 10), new MeshStandardMaterial({ color: POST, roughness: 0.7 }));
      pole.position.y = 0.72;
      pole.castShadow = true;
      const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.9 });
      this.lampGlass.push(glass);
      const bulb = new Mesh(new SphereGeometry(0.14, 14, 10), glass);
      bulb.position.y = 1.5;
      lamp.add(pole, bulb);
      lamp.position.set(point.x + outward.x * (ROAD_WIDTH / 2 + 0.25), GROUND, point.z + outward.z * (ROAD_WIDTH / 2 + 0.25));
      lamps.add(lamp);
    }
    return lamps;
  }
}
