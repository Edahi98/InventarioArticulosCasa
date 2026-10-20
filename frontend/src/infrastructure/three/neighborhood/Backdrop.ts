import {
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { GrassField } from "../GrassField.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { ToyBoat, type BoatKind } from "./ToyBoat.js";
import { ToyHelicopter, type HelicopterKind } from "./ToyHelicopter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { HueSequence } from "./HueSequence.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { MeshMerger } from "../MeshMerger.js";
import { SeededRandom } from "./SeededRandom.js";
import type { TreeFactory } from "./TreeFactory.js";
import { FARM_HILLS, HILL_COTTAGES, RAINBOW_COLORS } from "../../../constantes/barrio_constantes.js";
import { CloudPuffs } from "./CloudPuffs.js";
import { FarmAnimals, type FarmKind } from "./FarmAnimals.js";
import { GiantTreeBuilder } from "./GiantTreeBuilder.js";
import { HouseFactory } from "./HouseFactory.js";

interface Floater {
  group: Group;
  baseY: number;
  phase: number;
  spin: number;
}

interface Orbiter {
  group: Group;
  distance: number;
  height: number;
  speed: number;
  phase: number;
  facing: number;
}

const WATER = 0x9fd8f0;
const SOIL = 0xb98b73;
const GRASS = 0xbfe9d5;
const HILLS = [0xa9ddc5, 0xcfc3e6, 0xffd9c7, 0xc7e3b2, 0xb7d2f0] as const;
const UP = new Vector3(0, 1, 0);
const WATER_Y = -1.35;
const HELI_KINDS: HelicopterKind[] = ["carguero", "rescate", "reparto"];
const HELI_COLORS = [0xff6b6b, 0xfffaf2, 0x7fd0ea] as const;
const HELI_TONES: BearTone[] = ["sun", "rose", "lilac"];
const BOAT_KINDS: BoatKind[] = ["velero", "carguero", "pesquero", "lancha", "velero"];
const BOAT_TONES: BearTone[] = ["sky", "rose", "sun", "lilac", "rose"];

export class Backdrop {
  readonly group = new Group();
  private readonly floaters: Floater[] = [];
  private readonly balloons: Orbiter[] = [];
  private readonly boats: Orbiter[] = [];
  private readonly helicopters: { orbiter: Orbiter; rotor: Group; tailRotor: Group; sling: Group | null }[] = [];
  private readonly rainbow = new Group();
  private readonly rainbowMaterials: MeshBasicMaterial[] = [];
  private readonly blades = new Group();
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly rng = new SeededRandom("fondo");
  private readonly giants = new GiantTreeBuilder(new SeededRandom("gigantes-lomas"));
  private readonly puffs = new CloudPuffs();
  private readonly grazers: { head: Group; phase: number }[] = [];
  private readonly cottages = new HouseFactory();

  /**
   * Telón de fondo del archipiélago: agua, colinas pastel lejanas con árboles gigantes, casitas de cuento, ovejas y
   * vacas que pastan y un molino, islitas flotantes, globos aerostáticos rayados con los colores de las categorías,
   * un arcoíris grande con nubes esponjosas en sus pies y barquitos.
   *
   * @param radius - Radio de la isla; el resto se reparte a su alrededor.
   * @param categoryIds - Identificadores de las categorías, para pintar las rayas de los globos.
   * @param trees - Fábrica de árboles compartida.
   */
  constructor(
    private readonly radius: number,
    categoryIds: number[],
    private readonly trees: TreeFactory,
  ) {
    this.group.add(this.water(), ...this.hills(), ...this.islets(), ...this.makeBalloons(categoryIds), ...this.makeBoats(), ...this.makeHelicopters(), this.makeRainbow());
  }

  /**
   * Mece las islitas, hace girar a los globos y a los barcos alrededor de la isla, mueve las aspas del
   * molino y muestra el arcoíris solo de día.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.floaters.forEach((floater) => {
      floater.group.position.y = floater.baseY + Math.sin(t * 0.5 + floater.phase) * 0.35;
      floater.group.rotation.y = floater.phase + t * floater.spin;
    });
    this.balloons.forEach((balloon) => this.orbit(balloon, t, Math.sin(t * 0.4 + balloon.phase) * 0.45));
    this.boats.forEach((boat) => {
      this.orbit(boat, t, Math.sin(t * 1.3 + boat.phase) * 0.06);
      boat.group.rotation.z = Math.sin(t * 1.1 + boat.phase) * 0.05;
    });
    this.helicopters.forEach((heli) => {
      this.orbit(heli.orbiter, t, Math.sin(t * 0.9 + heli.orbiter.phase) * 0.35);
      heli.orbiter.group.rotation.z = Math.sin(t * 0.7 + heli.orbiter.phase) * 0.05;
      heli.rotor.rotation.y = t * 20;
      heli.tailRotor.rotation.z = t * 26;
      if (heli.sling) heli.sling.rotation.z = Math.sin(t * 1.3 + heli.orbiter.phase) * 0.14;
    });
    this.blades.rotation.z = t * 0.9;
    this.grazers.forEach((grazer) => {
      grazer.head.rotation.x = 0.35 + Math.sin(t * 1.4 + grazer.phase) * 0.3;
    });
    this.puffs.tint(night);
    const visible = (1 - night) * 0.8;
    this.rainbowMaterials.forEach((material) => {
      material.opacity = visible;
    });
    this.rainbow.visible = visible > 0.02;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.75, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.35 });
    this.materials.set(color, created);
    return created;
  }

  private orbit(item: Orbiter, t: number, bob: number): void {
    const angle = item.phase + t * item.speed;
    item.group.position.set(Math.cos(angle) * item.distance, item.height + bob, Math.sin(angle) * item.distance);
    item.group.rotation.y = -angle + item.facing;
  }

  private water(): Mesh {
    const plane = new Mesh(
      new CircleGeometry(this.radius * 12, 72),
      new MeshStandardMaterial({ color: WATER, roughness: 0.35, map: SurfaceTextures.ripples(), bumpMap: SurfaceTextures.ripples(), bumpScale: 0.5, transparent: true, alphaMap: Backdrop.depthFade(), depthWrite: false }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = WATER_Y;
    return plane;
  }

  private static depthFade(): CanvasTexture {
    return TextureCanvas.build("agua-profunda", 128, 128, false, (context, _rng, width, height) => {
      const fade = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      fade.addColorStop(0, "rgb(120,120,120)");
      fade.addColorStop(0.12, "rgb(150,150,150)");
      fade.addColorStop(0.25, "rgb(255,255,255)");
      fade.addColorStop(1, "rgb(255,255,255)");
      context.fillStyle = fade;
      context.fillRect(0, 0, width, height);
    });
  }

  private hills(): Group[] {
    const hills: Group[] = [];
    const count = 11;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + this.rng.between(-0.2, 0.2);
      const distance = this.radius * this.rng.between(1.95, 2.9);
      const width = this.radius * this.rng.between(0.5, 0.95);
      const height = this.radius * this.rng.between(0.16, 0.4);
      const hill = new Group();
      const dome = new Mesh(new SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.material(this.rng.pick(HILLS)));
      dome.scale.set(width, height, width * 0.85);
      hill.add(dome);
      if (index % 3 === 0) {
        const giant = this.giants.build(-width * 0.3, 0, this.rng.between(1.3, 1.9));
        giant.position.y = this.surface(width, height, -width * 0.3, 0) - 0.1;
        hill.add(giant);
      }
      if (index < FARM_HILLS) this.herd(hill, width, height, index);
      if (index >= FARM_HILLS && index < FARM_HILLS + HILL_COTTAGES) hill.add(this.cottage(width, height, index));
      for (let tree = 0; tree < this.rng.between(1, 4); tree += 1) {
        const dx = this.rng.between(-0.5, 0.5) * width;
        const lift = height * Math.sqrt(Math.max(1 - (dx / width) ** 2, 0)) * 0.97;
        const planted = this.trees.build(dx, 0, this.rng.between(1.4, 2.4), this.rng.chance(0.3));
        planted.position.y = lift;
        hill.add(planted);
      }
      hill.add(this.hillGrass(width, height, index));
      MeshMerger.merge(hill, [this.blades, ...this.grazers.map((grazer) => grazer.head)]);
      hill.position.set(Math.cos(angle) * distance, WATER_Y, Math.sin(angle) * distance);
      hill.rotation.y = this.rng.between(0, Math.PI * 2);
      hills.push(hill);
      if (index === 3) hill.add(this.windmill(width, height));
    }
    return hills;
  }

  private surface(width: number, height: number, x: number, z: number): number {
    const depth = width * 0.85;
    return height * Math.sqrt(Math.max(1 - (x / width) ** 2 - (z / depth) ** 2, 0));
  }

  private herd(hill: Group, width: number, height: number, index: number): void {
    const kinds: FarmKind[] = index % 2 === 0 ? ["oveja", "oveja", "vaca"] : ["vaca", "oveja", "oveja"];
    const size = Math.max(this.radius * 0.05, 1.1);
    kinds.forEach((kind, item) => {
      const x = width * this.rng.between(0.05, 0.45);
      const z = width * this.rng.between(-0.35, 0.35);
      const built = FarmAnimals.build(kind);
      built.group.position.set(x, this.surface(width, height, x, z) - 0.05, z);
      built.group.rotation.y = this.rng.between(0, Math.PI * 2);
      built.group.scale.setScalar(size * (kind === "vaca" ? 1.2 : 1));
      this.grazers.push({ head: built.head, phase: index * 2 + item });
      hill.add(built.group);
    });
  }

  private cottage(width: number, height: number, index: number): Group {
    const house = this.cottages.create(9001 + index * 37).group;
    const x = -width * 0.05;
    const z = width * 0.2;
    house.position.set(x, this.surface(width, height, x, z) - 0.1, z);
    house.scale.setScalar(Math.max(this.radius * 0.05, 1));
    house.rotation.y = this.rng.between(0, Math.PI * 2);
    return house;
  }

  private hillGrass(width: number, height: number, index: number): Group {
    const depth = width * 0.85;
    const inside = (x: number, z: number): number => 1 - (x / width) ** 2 - (z / depth) ** 2;
    return new GrassField({
      seed: `loma-${index}`,
      radius: width * 0.95,
      density: 4,
      scale: Math.max(1, width / 9),
      accept: (x, z) => inside(x, z) > 0.1,
      ground: (x, z) => height * Math.sqrt(Math.max(inside(x, z), 0)),
    }).group;
  }

  private windmill(hillWidth: number, hillHeight: number): Group {
    const unit = this.radius * 0.075;
    const mill = new Group();
    const tower = new Mesh(new CylinderGeometry(0.55, 0.85, 2.4, 14), this.material(0xfff6dc));
    tower.position.y = 1.2;
    const cap = new Mesh(new ConeGeometry(0.72, 0.9, 14), this.material(0xff8fb7));
    cap.position.y = 2.85;
    const hub = new Mesh(new SphereGeometry(0.2, 12, 10), this.material(0x6b4a6a));
    hub.position.set(0, 2.4, 0.78);
    this.blades.position.set(0, 2.4, 0.9);
    [0, 1, 2, 3].forEach((index) => {
      const arm = new Group();
      const blade = new Mesh(new RoundedBoxGeometry(0.42, 1.7, 0.06, 2, 0.03), this.material(0xffffff));
      blade.position.y = 1.0;
      arm.add(blade);
      arm.rotation.z = (index * Math.PI) / 2;
      this.blades.add(arm);
    });
    mill.add(tower, cap, hub, this.blades);
    mill.scale.setScalar(unit);
    mill.position.set(hillWidth * 0.1, hillHeight * 0.92, 0);
    return mill;
  }

  private islets(): Group[] {
    const items: Floater[] = [];
    const count = 7;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + this.rng.between(-0.25, 0.25);
      const distance = this.radius * this.rng.between(1.75, 2.5);
      const size = this.radius * this.rng.between(0.045, 0.085) + 0.6;
      const islet = new Group();
      const top = new Mesh(new CylinderGeometry(size, size * 0.96, 0.32, 28), this.material(GRASS));
      const soil = new Mesh(new ConeGeometry(size * 0.96, size * 1.6, 20), this.material(SOIL));
      soil.rotation.x = Math.PI;
      soil.position.y = -0.16 - size * 0.8;
      islet.add(top, soil, new GrassField({ seed: `islote-${index}`, radius: size * 0.92, y: 0.16, scale: 0.8, density: 6 }).group);
      const planted = Math.floor(this.rng.between(1, 3.99));
      for (let tree = 0; tree < planted; tree += 1) {
        const spot = (tree / planted) * Math.PI * 2 + this.rng.between(0, 1);
        const crown = this.trees.build(Math.cos(spot) * size * 0.45, Math.sin(spot) * size * 0.45, this.rng.between(0.55, 0.85), this.rng.chance(0.35));
        crown.position.y = 0.16;
        islet.add(crown);
      }
      const baseY = this.rng.between(2.2, 6.5);
      islet.position.set(Math.cos(angle) * distance, baseY, Math.sin(angle) * distance);
      items.push({ group: islet, baseY, phase: this.rng.between(0, Math.PI * 2), spin: this.rng.between(-0.04, 0.04) });
    }
    this.floaters.push(...items);
    return items.map((item) => item.group);
  }

  private stripes(ids: number[]): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 256;
    surface.height = 8;
    const context = surface.getContext("2d");
    const colors = (ids.length > 0 ? ids : [1, 2, 3]).slice(0, 6).map((id) => HueSequence.cssOf(id));
    if (context) {
      const bands = colors.length * 2;
      for (let band = 0; band < bands; band += 1) {
        context.fillStyle = band % 2 === 0 ? (colors[band / 2] as string) : "#fff6dc";
        context.fillRect((band / bands) * 256, 0, 256 / bands + 1, 8);
      }
    }
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private rope(from: Vector3, to: Vector3): Mesh {
    const direction = to.clone().sub(from);
    const rope = new Mesh(new CylinderGeometry(0.012, 0.012, 1, 5), this.material(0x6b4a6a));
    rope.scale.y = direction.length();
    rope.position.copy(from).addScaledVector(direction, 0.5);
    rope.quaternion.setFromUnitVectors(UP, direction.normalize());
    return rope;
  }

  private makeBalloons(ids: number[]): Group[] {
    const size = this.radius * 0.085 + 0.4;
    return Array.from({ length: 4 }, (_, index) => {
      const balloon = new Group();
      const rotated = ids.length > 0 ? [...ids.slice(index % ids.length), ...ids.slice(0, index % ids.length)] : ids;
      const canopy = new Mesh(new SphereGeometry(1, 30, 22), new MeshStandardMaterial({ map: this.stripes(rotated), roughness: 0.6 }));
      canopy.scale.set(1, 1.12, 1);
      canopy.position.y = 1.5;
      const basket = new Mesh(new RoundedBoxGeometry(0.5, 0.36, 0.5, 2, 0.08), this.material(0xc4805a));
      basket.position.y = -0.35;
      balloon.add(canopy, basket);
      [-1, 1].forEach((x) => [-1, 1].forEach((z) => balloon.add(this.rope(new Vector3(x * 0.2, -0.2, z * 0.2), new Vector3(x * 0.62, 0.7, z * 0.62)))));
      balloon.scale.setScalar(size);
      const item: Orbiter = {
        group: balloon,
        distance: this.radius * this.rng.between(1.4, 2.0),
        height: this.radius * this.rng.between(0.55, 0.95),
        speed: this.rng.between(0.018, 0.034),
        phase: (index / 4) * Math.PI * 2 + this.rng.between(0, 0.8),
        facing: 0,
      };
      this.balloons.push(item);
      return balloon;
    });
  }

  private makeBoats(): Group[] {
    const size = Math.max(this.radius * 0.14, 1.6);
    const colors = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8] as const;
    return colors.map((color, index) => {
      const boat = ToyBoat.build(color, BOAT_KINDS[index % BOAT_KINDS.length] as BoatKind, BOAT_TONES[index % BOAT_TONES.length] as BearTone, index);
      boat.scale.setScalar(size);
      const item: Orbiter = {
        group: boat,
        distance: this.radius * this.rng.between(1.2, 1.55),
        height: WATER_Y + 0.22,
        speed: this.rng.between(0.03, 0.06) * (index % 2 === 0 ? 1 : -1),
        phase: (index / colors.length) * Math.PI * 2 + this.rng.between(0, 0.6),
        facing: index % 2 === 0 ? 0 : Math.PI,
      };
      this.boats.push(item);
      return boat;
    });
  }

  private makeHelicopters(): Group[] {
    const size = Math.max(this.radius * 0.17, 1.9);
    return HELI_KINDS.map((kind, index) => {
      const built = ToyHelicopter.build(HELI_COLORS[index] as number, kind, HELI_TONES[index] as BearTone);
      built.group.scale.setScalar(size);
      const orbiter: Orbiter = {
        group: built.group,
        distance: this.radius * this.rng.between(0.9, 1.3),
        height: this.radius * this.rng.between(0.5, 0.8),
        speed: this.rng.between(0.06, 0.1) * (index % 2 === 0 ? 1 : -1),
        phase: (index / HELI_KINDS.length) * Math.PI * 2 + this.rng.between(0, 0.8),
        facing: index % 2 === 0 ? 0 : Math.PI,
      };
      this.helicopters.push({ orbiter, rotor: built.rotor, tailRotor: built.tailRotor, sling: built.sling });
      return built.group;
    });
  }

  private makeRainbow(): Group {
    const inner = this.radius * 1.55;
    const band = this.radius * 0.055;
    RAINBOW_COLORS.forEach((color, index) => {
      const material = new MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false });
      this.rainbowMaterials.push(material);
      const arc = new Mesh(new TorusGeometry(inner + index * band * 1.6, band, 10, 120, Math.PI), material);
      arc.scale.z = 0.35;
      this.rainbow.add(arc);
    });
    const reach = inner + (RAINBOW_COLORS.length - 1) * band * 0.8;
    [-1, 1].forEach((side) => {
      const cloud = this.puffs.build(this.rng, this.radius * 0.11);
      cloud.position.set(side * reach, this.radius * 0.03, 0);
      this.rainbow.add(cloud);
    });
    this.rainbow.position.set(0, WATER_Y, -this.radius * 2.6);
    return this.rainbow;
  }
}
