import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";

export interface StreetActors {
  swaying: Group[];
  car: Group;
  clouds: Group[];
  windows: MeshStandardMaterial[];
}

export interface StreetWorld {
  world: Group;
  actors: StreetActors;
}

const WALLS = [0xffd9c7, 0xfff1c2, 0xc9f0e0, 0xe4d9ff, 0xffc2d8, 0xdcebd0] as const;
const ROOFS = [0xff8fb7, 0xb89cf2, 0x7fd0ea, 0xffb066, 0x5a3d57] as const;
const FOLIAGE = [0x7fd0a0, 0x9bdc8a, 0xffa8c8, 0xb7e08a] as const;

const GRASS = 0xbfe9d5;
const ASPHALT = 0x5b4a66;
const SIDEWALK = 0xf3dfe9;
const LINE = 0xfff0d6;
const TRUNK = 0x8a5a44;
const POST = 0x5a3d57;
const GLOW = 0xffd37a;

const STREET_LENGTH = 44;
const ROAD_WIDTH = 2.6;

export class StreetBuilder {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly windows: MeshStandardMaterial[] = [];
  private readonly rng: () => number;

  /**
   * @param seed - Texto que decide la forma de la calle: la misma ubicación siempre dibuja la misma calle.
   */
  constructor(seed: string) {
    this.rng = StreetBuilder.randomFrom(seed);
  }

  /**
   * Arma la calle completa: suelo, avenida, banquetas, casas, árboles, faroles, nubes y un carrito.
   *
   * @returns El mundo 3D y los elementos que se animan.
   */
  build(): StreetWorld {
    const world = new Group();
    const swaying: Group[] = [];
    world.add(...this.ground());
    this.backHouses().forEach((house) => world.add(house));
    this.trees().forEach((tree) => {
      world.add(tree);
      swaying.push(tree);
    });
    world.add(...this.lamps());
    const car = this.car();
    const clouds = this.clouds();
    world.add(car, ...clouds);
    return { world, actors: { swaying, car, clouds, windows: this.windows } };
  }

  private static randomFrom(seed: string): () => number {
    let state = 2166136261;
    for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private between(min: number, max: number): number {
    return min + this.rng() * (max - min);
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.rng() * items.length)] as T;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02 });
    this.materials.set(color, created);
    return created;
  }

  private glowing(): MeshStandardMaterial {
    const lit = new MeshStandardMaterial({
      color: 0xfff6dc,
      emissive: GLOW,
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });
    this.windows.push(lit);
    return lit;
  }

  private block(
    size: [number, number, number],
    color: number | MeshStandardMaterial,
    position: [number, number, number],
    shadows = true,
  ): Mesh {
    const material = typeof color === "number" ? this.material(color) : color;
    const mesh = new Mesh(new BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    return mesh;
  }

  private ground(): Mesh[] {
    const dashes = Array.from({ length: Math.floor(STREET_LENGTH / 1.6) }, (_, index) =>
      this.block([0.7, 0.01, 0.1], LINE, [-STREET_LENGTH / 2 + index * 1.6 + 0.4, 0.065, 0], false),
    );
    return [
      this.block([STREET_LENGTH, 0.1, 40], GRASS, [0, -0.05, -8], false),
      this.block([STREET_LENGTH, 0.06, ROAD_WIDTH], ASPHALT, [0, 0.03, 0], false),
      this.block([STREET_LENGTH, 0.12, 0.9], SIDEWALK, [0, 0.06, -ROAD_WIDTH / 2 - 0.45], false),
      this.block([STREET_LENGTH, 0.12, 0.9], SIDEWALK, [0, 0.06, ROAD_WIDTH / 2 + 0.45], false),
      ...dashes,
    ];
  }

  private backHouses(): Group[] {
    const houses: Group[] = [];
    let x = -STREET_LENGTH / 2 + 2;
    while (x < STREET_LENGTH / 2 - 2) {
      const width = this.between(1.6, 2.5);
      houses.push(this.house(x + width / 2, -4.1 - this.between(0, 0.5), width));
      x += width + this.between(0.7, 1.7);
    }
    return houses;
  }

  private house(x: number, z: number, width: number): Group {
    const height = this.between(1.3, 2.1);
    const depth = this.between(1.6, 2.2);
    const roofColor = this.pick(ROOFS);
    const house = new Group();
    house.position.set(x, 0, z);

    const roofGeometry = new ConeGeometry(Math.max(width, depth) * 0.78, 0.95, 4);
    roofGeometry.rotateY(Math.PI / 4);
    const roof = new Mesh(roofGeometry, this.material(roofColor));
    roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    roof.position.y = height + 0.47;
    roof.castShadow = true;

    const door = this.block([0.36, 0.72, 0.06], this.pick(ROOFS), [width * 0.2, 0.36, depth / 2 + 0.02], false);
    const windows = [-0.28, 0.28].map((side) =>
      this.block([0.34, 0.34, 0.06], this.glowing(), [width * side - width * 0.1, height * 0.62, depth / 2 + 0.02], false),
    );
    const step = this.block([0.6, 0.08, 0.3], SIDEWALK, [width * 0.2, 0.04, depth / 2 + 0.15], false);

    house.add(this.block([width, height, depth], this.pick(WALLS), [0, height / 2, 0]), roof, door, step, ...windows);
    if (this.rng() > 0.5) {
      house.add(this.block([0.26, 0.6, 0.26], POST, [width * 0.28, height + 0.62, -depth * 0.15]));
    }
    return house;
  }

  private trees(): Group[] {
    const trees: Group[] = [];
    for (let x = -STREET_LENGTH / 2 + 1; x < STREET_LENGTH / 2; x += this.between(4.6, 8)) {
      trees.push(this.tree(x, ROAD_WIDTH / 2 + 1.5 + this.between(0, 0.4), this.between(0.42, 0.62)));
    }
    for (let x = -STREET_LENGTH / 2 + 3; x < STREET_LENGTH / 2; x += this.between(3, 6)) {
      trees.push(this.tree(x, -ROAD_WIDTH / 2 - 1.3, this.between(0.7, 1)));
    }
    for (let x = -STREET_LENGTH / 2 + 1; x < STREET_LENGTH / 2; x += this.between(2, 3.4)) {
      trees.push(this.tree(x, -7.6 - this.between(0, 2.2), this.between(1.1, 1.7)));
    }
    return trees;
  }

  private tree(x: number, z: number, scale: number): Group {
    const tree = new Group();
    const trunk = new Mesh(new CylinderGeometry(0.09, 0.14, 0.6, 8), this.material(TRUNK));
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    const color = this.pick(FOLIAGE);
    const lower = new Mesh(new SphereGeometry(0.58, 14, 12), this.material(color));
    lower.position.y = 0.95;
    const upper = new Mesh(new SphereGeometry(0.42, 14, 12), this.material(color));
    upper.position.y = 1.5;
    lower.castShadow = true;
    upper.castShadow = true;
    tree.add(trunk, lower, upper);
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = this.between(0, Math.PI);
    return tree;
  }

  private lamps(): Group[] {
    const lamps: Group[] = [];
    for (let x = -STREET_LENGTH / 2 + 3; x < STREET_LENGTH / 2; x += 6.5) {
      const lamp = new Group();
      const pole = new Mesh(new CylinderGeometry(0.035, 0.05, 1.6, 8), this.material(POST));
      pole.position.y = 0.8;
      pole.castShadow = true;
      const bulb = new Mesh(new SphereGeometry(0.14, 14, 12), this.glowing());
      bulb.position.y = 1.68;
      lamp.add(pole, bulb);
      lamp.position.set(x, 0.12, ROAD_WIDTH / 2 + 0.55);
      lamps.push(lamp);
    }
    return lamps;
  }

  private car(): Group {
    const car = new Group();
    const wheels = [-0.3, 0.3].flatMap((x) =>
      [-0.24, 0.24].map((z) => {
        const wheel = new Mesh(new CylinderGeometry(0.1, 0.1, 0.08, 14), this.material(POST));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.1, z);
        return wheel;
      }),
    );
    car.add(
      this.block([0.95, 0.26, 0.5], 0xff4f8b, [0, 0.26, 0]),
      this.block([0.5, 0.24, 0.44], 0xfff6dc, [-0.05, 0.5, 0]),
      ...wheels,
    );
    car.position.set(-4, 0.04, 0.55);
    return car;
  }

  private clouds(): Group[] {
    const white = new MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffe3ee, emissiveIntensity: 0.35 });
    return Array.from({ length: 6 }, (_, index) => {
      const cloud = new Group();
      [-0.6, 0, 0.6].forEach((offset, part) => {
        const puff = new Mesh(new SphereGeometry(part === 1 ? 0.62 : 0.44, 12, 10), white);
        puff.position.set(offset, part === 1 ? 0.12 : 0, 0);
        cloud.add(puff);
      });
      cloud.position.set(-STREET_LENGTH / 2 + index * 8 + this.between(0, 3), this.between(5.5, 8), -12 - this.between(0, 6));
      cloud.scale.setScalar(this.between(0.9, 1.6));
      return cloud;
    });
  }
}
