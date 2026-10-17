import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { DayLife } from "./DayLife.js";
import { HouseFactory } from "./HouseFactory.js";
import { HouseLife, type SmokePuff } from "./HouseLife.js";
import { SeededRandom } from "./SeededRandom.js";
import { StreetFurniture } from "./StreetFurniture.js";
import { Traffic } from "./Traffic.js";
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
  width: number;
  depth: number;
}

const LOT_WIDTH = 4.2;
const LOT_DEPTH = 3.6;
const ROAD = 1.5;
const MARGIN = 2.2;

const GRASS = 0xbfe9d5;
const SLAB = 0x8a6384;
const ASPHALT = 0x5b4a66;
const SIDEWALK = 0xf3dfe9;
const LINE = 0xfff0d6;
const TRUNK = 0x8a5a44;
const POST = 0x5a3d57;
const FOLIAGE = [0x7fd0a0, 0x9bdc8a, 0xffa8c8, 0xb7e08a] as const;

export class NeighborhoodBuilder {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly rng = new SeededRandom("barrio");
  private readonly life = new HouseLife(this.rng);
  private readonly lampGlass: MeshStandardMaterial[] = [];

  /**
   * @param categories - Categorías del inventario; cada una se vuelve una casa.
   * @param factory - Fábrica de casas a partir de plantillas.
   */
  constructor(
    private readonly categories: MapCategory[],
    private readonly factory: HouseFactory = new HouseFactory(),
  ) {}

  /**
   * Arma el barrio: una maqueta con calles en cuadrícula, una casa por categoría con su jardín,
   * árboles y faroles.
   *
   * @returns El mundo 3D, las casas y las medidas del terreno.
   */
  build(): NeighborhoodWorld {
    const count = Math.max(this.categories.length, 1);
    const columns = Math.min(count, Math.ceil(Math.sqrt(count * 1.5)));
    const rows = Math.ceil(count / columns);
    const pitch = LOT_DEPTH + ROAD;
    const width = columns * LOT_WIDTH;
    const depth = rows * pitch;

    const world = new Group();
    const swaying: Group[] = [];
    const houses: HouseEntry[] = [];
    const roadsZ: number[] = [];
    const yards = new YardDetails(this.rng, LOT_WIDTH, LOT_DEPTH);
    world.add(...this.base(width, depth));

    for (let row = 0; row < rows; row += 1) {
      const z = (row - (rows - 1) / 2) * pitch;
      const roadZ = z + LOT_DEPTH / 2 + ROAD / 2 - 0.05;
      roadsZ.push(roadZ);
      world.add(...this.road(width, roadZ));
      world.add(...this.lamps(width, z + LOT_DEPTH / 2 + 0.1));
    }
    const traffic = new Traffic(roadsZ, width + MARGIN * 2, ROAD);
    const dayLife = new DayLife(width, depth);
    world.add(new StreetFurniture().build(roadsZ, width, ROAD), traffic.group, dayLife.group);
    this.categories.forEach((category, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const inRow = Math.min(columns, count - row * columns);
      const x = (column - (inRow - 1) / 2) * LOT_WIDTH;
      const z = (row - (rows - 1) / 2) * pitch;
      const entry = this.lot(category, x, z);
      entry.house.group.updateMatrixWorld(true);
      const door = entry.house.door.getWorldPosition(new Vector3());
      const yard = yards.build(x, z, door.x + 0.19, door.z, HouseFactory.accentColor(category.id));
      world.add(entry.garden, entry.flowers, yard, entry.house.group);
      houses.push(entry.house);
      this.lotTrees(x, z).forEach((tree) => {
        world.add(tree);
        swaying.push(tree);
      });
    });
    this.borderTrees(width, depth).forEach((tree) => {
      world.add(tree);
      swaying.push(tree);
    });
    return { world, houses, swaying, lamps: this.lampGlass, traffic, dayLife, width, depth };
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02 });
    this.materials.set(color, created);
    return created;
  }

  private slab(size: [number, number, number], color: number, position: [number, number, number]): Mesh {
    const mesh = new Mesh(new BoxGeometry(...size), this.material(color));
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    return mesh;
  }

  private base(width: number, depth: number): Mesh[] {
    return [
      this.slab([width + MARGIN * 2, 0.4, depth + MARGIN * 2], GRASS, [0, -0.2, 0]),
      this.slab([width + MARGIN * 2 + 0.3, 0.3, depth + MARGIN * 2 + 0.3], SLAB, [0, -0.55, 0]),
    ];
  }

  private road(width: number, z: number): Mesh[] {
    const dashes = Array.from({ length: Math.floor((width + MARGIN) / 1.5) }, (_, index) =>
      this.slab([0.6, 0.01, 0.08], LINE, [-width / 2 - MARGIN / 2 + 0.6 + index * 1.5, 0.045, z]),
    );
    return [
      this.slab([width + MARGIN * 2, 0.04, ROAD], ASPHALT, [0, 0.02, z]),
      this.slab([width + MARGIN * 2, 0.06, 0.3], SIDEWALK, [0, 0.03, z - ROAD / 2 - 0.1]),
      this.slab([width + MARGIN * 2, 0.06, 0.3], SIDEWALK, [0, 0.03, z + ROAD / 2 + 0.1]),
      ...dashes,
    ];
  }

  private lamps(width: number, z: number): Group[] {
    return [-1, 1].map((side) => {
      const lamp = new Group();
      const pole = new Mesh(new CylinderGeometry(0.035, 0.05, 1.4, 8), this.material(POST));
      pole.position.y = 0.7;
      pole.castShadow = true;
      const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.9 });
      this.lampGlass.push(glass);
      const bulb = new Mesh(new SphereGeometry(0.13, 12, 10), glass);
      bulb.position.y = 1.45;
      lamp.add(pole, bulb);
      lamp.position.set(side * (width / 2 + MARGIN * 0.55), 0, z);
      return lamp;
    });
  }

  private lot(category: MapCategory, x: number, z: number): { house: HouseEntry; garden: Mesh; flowers: Group } {
    const built = this.factory.create(category.id);
    const garden = this.slab([LOT_WIDTH - 0.5, 0.06, LOT_DEPTH - 0.3], HouseFactory.gardenColor(category.id), [x, 0.03, z]);
    built.group.position.set(x + this.rng.between(-0.15, 0.15), 0.06, z - 0.15);
    built.group.rotation.y = this.rng.between(-0.05, 0.05);
    built.group.userData.categoryId = category.id;
    return {
      garden,
      flowers: this.life.garden(x, z, category.count, HouseFactory.accentColor(category.id)),
      house: {
        id: category.id,
        name: category.name,
        count: category.count,
        group: built.group,
        glass: built.glass,
        door: built.door,
        smoke: this.life.smoke(built.group, built.chimney, category.count),
        baseY: built.group.position.y,
        height: built.height,
        templateId: built.templateId,
      },
    };
  }

  private lotTrees(x: number, z: number): Group[] {
    return [-1, 1]
      .filter(() => this.rng.chance(0.55))
      .map((side) => this.tree(x + side * (LOT_WIDTH / 2 - 0.42), z - LOT_DEPTH / 2 + 0.45, this.rng.between(0.5, 0.8)));
  }

  private borderTrees(width: number, depth: number): Group[] {
    const trees: Group[] = [];
    for (let x = -width / 2 - 0.6; x <= width / 2 + 0.6; x += this.rng.between(1.6, 2.6)) {
      trees.push(this.tree(x, -depth / 2 - MARGIN * 0.5, this.rng.between(0.8, 1.2)));
    }
    for (let z = -depth / 2; z <= depth / 2; z += this.rng.between(2, 3.4)) {
      trees.push(this.tree(-width / 2 - MARGIN * 0.55, z, this.rng.between(0.7, 1.1)));
      trees.push(this.tree(width / 2 + MARGIN * 0.55, z, this.rng.between(0.7, 1.1)));
    }
    return trees;
  }

  private tree(x: number, z: number, scale: number): Group {
    const tree = new Group();
    const trunk = new Mesh(new CylinderGeometry(0.09, 0.14, 0.6, 8), this.material(TRUNK));
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    const color = this.rng.pick(FOLIAGE);
    const lower = new Mesh(new SphereGeometry(0.58, 12, 10), this.material(color));
    lower.position.y = 0.95;
    const upper = new Mesh(new SphereGeometry(0.42, 12, 10), this.material(color));
    upper.position.y = 1.5;
    lower.castShadow = true;
    upper.castShadow = true;
    tree.add(trunk, lower, upper);
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    return tree;
  }
}
