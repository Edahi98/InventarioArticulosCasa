import { AdditiveBlending, CanvasTexture, CircleGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, SRGBColorSpace, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { GrassField } from "../GrassField.js";
import { StarGeometry } from "../StarGeometry.js";
import { HelicopterFleet } from "../neighborhood/HelicopterFleet.js";
import { SeaTextures } from "./SeaTextures.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

const TOP = 0.45;
const WATER = -0.6;
const FLOOR = -9;
const WEEDS = 64;
const BUBBLES = 34;
const RAYS = 7;
const SCHOOL = 16;
const LEAP_SECONDS = 2.2;
const FISH_COLORS = [[0xff8fb7, 0xffd0e0], [0xffb066, 0xffe35c], [0x7fd0ea, 0xc4ecf8], [0xb89cf2, 0xdccffa], [0x86d6a8, 0xc5ecd6]] as const;
const WEED_COLORS = [0x2fa36b, 0x5fb87a, 0x86d6a8, 0x9be26b, 0x3d8f4a] as const;
const CORAL_COLORS = [0xff8a3d, 0xff6f91, 0xffb066] as const;
const ROCK_COLORS = [0x9aa5b1, 0xb0b8c4, 0x8892a0] as const;
const ROCK_TINTS = [0xd8dde6, 0xcbc2e2, 0xb9c5d8] as const;
const CHECKS = 4;
const CHECK_CYCLE = 9;
const PRINTS = 6;
const BALLOON_COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8] as const;
const QUESTION_COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c] as const;

interface Floater {
  group: Group;
  base: Vector3;
  phase: number;
  hitAt: number;
}

interface Swimmer {
  group: Group;
  tail: Group;
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  depth: number;
  speed: number;
  phase: number;
}

interface Leaper {
  group: Group;
  from: number;
  to: number;
  z: number;
  period: number;
  phase: number;
}

interface Mermaid {
  group: Group;
  pose: Group;
  tail: Group;
  arm: Group;
  base: Vector3;
  phase: number;
  hitAt: number;
  swims: boolean;
}

export class ChecklistWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = true;
  private readonly foam: Mesh[] = [];
  private readonly fleet = new HelicopterFleet({ center: [0, 9.5, -8], rx: 22, rz: 9, scale: 3.2 });
  private readonly materials = new Map<string, MeshStandardMaterial>();
  private caustics: CanvasTexture | null = null;
  private readonly rays: { material: MeshBasicMaterial; phase: number }[] = [];
  private readonly turtle = new Group();
  private readonly flippers: Group[] = [];
  private readonly weeds: { segments: Group[]; phase: number }[] = [];
  private readonly swimmers: Swimmer[] = [];
  private readonly leapers: Leaper[] = [];
  private readonly mermaids: Mermaid[] = [];
  private readonly bubbles: { mesh: Mesh; x: number; z: number; speed: number; phase: number }[] = [];
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("archipielago");
  private readonly flameMaterial = new MeshStandardMaterial({ color: 0xffd43b, emissive: 0xff9f1c, emissiveIntensity: 0.9, roughness: 0.4 });
  private readonly bulbMaterial = new MeshStandardMaterial({ color: 0xfff3ac, emissive: 0xffe066, emissiveIntensity: 0.6, roughness: 0.3 });
  private readonly starMaterial = new MeshStandardMaterial({ color: 0xffd43b, emissive: 0xffb300, emissiveIntensity: 0.6, roughness: 0.35 });
  private readonly hoppers: Floater[] = [];
  private readonly balloons: Floater[] = [];
  private readonly questions: Floater[] = [];
  private readonly flames: Mesh[] = [];
  private readonly prints: Mesh[] = [];
  private readonly ticks: Group[] = [];
  private readonly stars: { mesh: Mesh; base: Vector3; phase: number }[] = [];
  private readonly bears: { bear: GuardianBear; hitAt: number }[] = [];
  private readonly cake = new Group();
  private readonly magnifier = new Group();
  private readonly flowers: Group[] = [];
  private cakeHitAt = -10;
  private lensHitAt = -10;
  private checksStart = 0;

  /**
   * El archipiélago de la lista: seis islas que emergen de un mar turquesa, cada una con su oficio. En la de repostería
   * hay un pastel con su vela, cupcakes, un tazón con batidor y un rodillo; en la de búsqueda, una lupa gigante, huellas
   * y signos de pregunta; en el taller, una caja de herramientas y un foco; en el campamento, una carpa con fogata y
   * farol; en la de la lista, un portapapeles que va marcando sus casillas; y en el jardín, flores y una regadera. Bajo
   * el agua se mecen las algas, nadan peces (y algunos saltan), flotan burbujas y hay sirenas, dos sentadas en rocas y
   * una nadando. Es el fondo de la pantalla «¿Tengo todo?».
   */
  constructor() {
    const toy = new Toy(new ClayMaterials());
    const bears = new BearBuilder();
    this.group.add(this.confetti.mesh);
    this.ocean(toy);
    this.bakery(toy, bears, this.island(toy, -14, 0, 3, 6.4, 0xbfe9d5));
    this.search(toy, bears, this.island(toy, 13.5, 0, -5, 5.8, 0xcfc3e6));
    this.workshop(toy, this.island(toy, 21, 0, 7, 4.4, 0xffd9c7));
    this.camp(toy, bears, this.island(toy, -23, 0, -5, 4.8, 0xc7e3b2));
    this.checklist(toy, this.island(toy, 1, 0, -13, 4.6, 0xb7d2f0));
    this.garden(toy, this.island(toy, 7, 0, 8, 3.8, 0xc9eccf));
    this.seaLife(toy);
    this.group.add(this.fleet.group);
    for (let index = 0; index < BALLOON_COLORS.length; index += 1) this.addBalloon(toy, index);
    for (let index = 0; index < 5; index += 1) this.addStar(index);
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Hace flotar las islas, titilar las velas y la fogata, marcar las casillas del portapapeles, pasear la lupa,
   * aparecer las huellas, flotar los signos, globos y estrellas, mecer las flores y asomarse a los ositos.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.foam.forEach((ring, index) => ring.scale.setScalar(1 + Math.sin(t * 1.2 + index) * 0.04));
    this.fleet.update(elapsed, moving);
    this.caustics?.offset.set(t * 0.012, t * 0.008);
    this.rays.forEach((ray) => (ray.material.opacity = 0.08 + Math.sin(t * 0.5 + ray.phase) * 0.04));
    const lap = Math.sin(t * 0.12);
    this.turtle.position.set(lap * 24, -4.4 + Math.sin(t * 0.6) * 0.4, -12);
    this.turtle.rotation.y = Math.cos(t * 0.12) > 0 ? 0 : Math.PI;
    this.flippers.forEach((flipper, index) => (flipper.rotation.x = Math.sin(t * 2 + index * Math.PI) * 0.5));
    this.weeds.forEach((weed) => weed.segments.forEach((segment, index) => (segment.rotation.z = Math.sin(t * 1.1 + weed.phase + index * 0.6) * 0.18)));
    this.swimmers.forEach((fish) => {
      const angle = t * fish.speed + fish.phase;
      fish.group.position.set(fish.cx + Math.cos(angle) * fish.rx, fish.depth + Math.sin(angle * 2) * 0.4, fish.cz + Math.sin(angle) * fish.rz);
      fish.group.rotation.y = Math.atan2(Math.cos(angle) * fish.rz, -Math.sin(angle) * fish.rx);
      fish.tail.rotation.y = Math.sin(t * 8 + fish.phase) * 0.5;
    });
    this.leapers.forEach((fish) => {
      const into = (t + fish.phase) % fish.period;
      fish.group.visible = moving && into < LEAP_SECONDS;
      const along = Math.min(1, into / LEAP_SECONDS);
      fish.group.position.set(fish.from + (fish.to - fish.from) * along, WATER - 0.3 + Math.sin(Math.PI * along) * 4.5, fish.z);
      fish.group.rotation.set(0, fish.to > fish.from ? 0 : Math.PI, (1 - 2 * along) * 0.8);
    });
    this.mermaids.forEach((mermaid) => {
      const wave = Math.max(0, 1 - (elapsed - mermaid.hitAt) / 1.4);
      mermaid.tail.rotation.z = Math.sin(t * 2.4 + mermaid.phase) * 0.32;
      mermaid.arm.rotation.z = -1.1 + Math.sin(t * (4 + wave * 6) + mermaid.phase) * (0.35 + wave * 0.4);
      if (!mermaid.swims) {
        mermaid.pose.rotation.z = Math.sin(t * 0.8 + mermaid.phase) * 0.05;
        mermaid.group.position.y = mermaid.base.y + wave * Math.sin(wave * Math.PI) * 0.8;
        return;
      }
      const lap = Math.sin(t * 0.35 + mermaid.phase);
      mermaid.group.position.set(mermaid.base.x + lap * 6, mermaid.base.y + Math.sin(t * 1.1) * 0.5, mermaid.base.z);
      mermaid.group.rotation.y = Math.cos(t * 0.35 + mermaid.phase) > 0 ? 0 : Math.PI;
    });
    this.bubbles.forEach((bubble) => {
      const rise = (t * bubble.speed + bubble.phase) % 1;
      bubble.mesh.position.set(bubble.x + Math.sin(t * 1.6 + bubble.phase * 9) * 0.4, FLOOR + 0.5 + rise * (WATER - FLOOR - 0.5), bubble.z);
      bubble.mesh.scale.setScalar(0.5 + rise * 0.6);
    });

    const cakeHop = Math.max(0, 1 - (elapsed - this.cakeHitAt) / 1);
    this.cake.position.y = TOP + Math.sin(t * 1.3) * 0.06 + cakeHop * Math.sin(cakeHop * Math.PI) * 1.2;
    this.cake.rotation.y = cakeHop * Math.PI * 2;
    this.flames.forEach((flame, index) => flame.scale.set(1, 1.15 + Math.sin(t * 9 + index) * 0.2 + (index === 0 ? cakeHop * 0.6 : 0), 1));
    this.flameMaterial.emissiveIntensity = 0.8 + night * 0.8 + Math.sin(t * 7) * 0.15;
    this.bulbMaterial.emissiveIntensity = 0.5 + night * 1.2 + Math.sin(t * 2.2) * 0.25;

    const cycle = (elapsed - this.checksStart) % CHECK_CYCLE;
    this.ticks.forEach((tick, index) => tick.scale.setScalar(Math.max(0.001, moving ? Math.max(0, Math.min(1, (cycle - 0.8 - index * 1.1) * 3)) : 1)));

    const zoom = Math.max(0, 1 - (elapsed - this.lensHitAt) / 1.2);
    this.magnifier.position.x = Math.sin(t * 0.5) * 1.6;
    this.magnifier.position.y = TOP + 3.9 + Math.sin(t * 0.9) * 0.25 + zoom * 1.2;
    this.magnifier.rotation.z = 0.3 + Math.sin(t * 0.6) * 0.12;
    this.magnifier.scale.setScalar(1 + zoom * Math.sin(zoom * Math.PI) * 0.3);
    this.prints.forEach((print, index) => {
      const wave = (t * 0.9 - index * 0.4) % (PRINTS * 0.4 + 2);
      print.scale.setScalar(Math.max(0.001, Math.min(1, wave * 2)) * (wave > PRINTS * 0.4 ? Math.max(0, 1 - (wave - PRINTS * 0.4)) : 1));
    });

    this.hoppers.forEach((hopper) => {
      const hop = Math.max(0, 1 - (elapsed - hopper.hitAt) / 0.9);
      hopper.group.position.y = hopper.base.y + Math.sin(t * 1.4 + hopper.phase) * 0.1 + hop * Math.sin(hop * Math.PI) * 1.4;
      hopper.group.rotation.y = hop * Math.PI * 2;
    });
    this.questions.forEach((question) => {
      const spin = Math.max(0, 1 - (elapsed - question.hitAt) / 1);
      question.group.position.set(question.base.x, question.base.y + Math.sin(t * 0.8 + question.phase) * 0.6, question.base.z);
      question.group.rotation.y = Math.sin(t * 0.5 + question.phase) * 0.6 + spin * Math.PI * 2;
    });
    this.flowers.forEach((flower, index) => {
      flower.rotation.z = Math.sin(t * 1.1 + index * 1.7) * 0.12;
    });
    this.balloons.forEach((balloon) => {
      const hop = Math.max(0, 1 - (elapsed - balloon.hitAt) / 1);
      balloon.group.position.set(balloon.base.x + Math.sin(t * 0.5 + balloon.phase) * 0.8, balloon.base.y + Math.sin(t * 0.8 + balloon.phase) * 0.7 + hop * 1.6, balloon.base.z);
      balloon.group.rotation.z = Math.sin(t * 0.6 + balloon.phase) * 0.12 + hop * 0.5;
    });
    this.bears.forEach((entry, index) => {
      const hop = Math.max(0, 1 - (elapsed - entry.hitAt) / 1);
      entry.bear.group.position.y = TOP + hop * 0.9;
      entry.bear.update(elapsed + index, hop > 0 ? 1 : 0, moving);
    });
    this.starMaterial.emissiveIntensity = 0.5 + night * 0.9 + Math.sin(t * 2) * 0.1;
    this.stars.forEach((star) => {
      star.mesh.position.set(star.base.x, star.base.y + Math.sin(t * 1.2 + star.phase) * 0.4, star.base.z);
      star.mesh.rotation.y = t * 0.9 + star.phase;
    });
    this.confetti.update(0.016);
    if (moving && Math.sin(t * 0.37) > 0.995) this.confetti.burst(new Vector3(-15, 8, 0), 35);
  }

  private ocean(toy: Toy): void {
    const floor = new Mesh(new CircleGeometry(170, 48), this.material("sand", () => new MeshStandardMaterial({ color: 0xffffff, map: SeaTextures.sand(), bumpMap: SeaTextures.sand(), bumpScale: 1.4, roughness: 1 })));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    const water = new Mesh(new CircleGeometry(170, 48), new MeshStandardMaterial({ color: 0x2a8fe0, transparent: true, opacity: 0.16, roughness: 0.2, depthWrite: false }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER;
    this.group.add(this.deepWater(), floor, water);
    this.caustics = SeaTextures.caustics();
    const light = new Mesh(new CircleGeometry(170, 48), new MeshBasicMaterial({ map: this.caustics, transparent: true, opacity: 0.38, blending: AdditiveBlending, depthWrite: false }));
    light.rotation.x = -Math.PI / 2;
    light.position.y = FLOOR + 0.06;
    this.group.add(light);
    for (let index = 0; index < RAYS; index += 1) {
      const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false, side: DoubleSide });
      const ray = new Mesh(new PlaneGeometry(2.6, 17), material);
      ray.position.set(-32 + index * 10.5, WATER - 8, -22 + (index % 3) * 9);
      ray.rotation.z = 0.28;
      this.rays.push({ material, phase: index * 1.3 });
      this.group.add(ray);
    }
  }

  private deepWater(): Mesh {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, "#7fdcf7");
      gradient.addColorStop(0.45, "#2a8fe0");
      gradient.addColorStop(1, "#0a3f9a");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 4, 256);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const height = WATER - FLOOR + 1;
    const wall = new Mesh(new PlaneGeometry(280, height), new MeshBasicMaterial({ map: texture }));
    wall.position.set(0, FLOOR + height / 2, -48);
    return wall;
  }

  private material(key: string, create: () => MeshStandardMaterial): MeshStandardMaterial {
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = create();
    this.materials.set(key, created);
    return created;
  }

  private rockMaterial(index: number): MeshStandardMaterial {
    const tint = ROCK_TINTS[index % ROCK_TINTS.length] as number;
    return this.material(`rock-${tint}`, () => new MeshStandardMaterial({ color: tint, map: SeaTextures.rock(), bumpMap: SeaTextures.rock(), bumpScale: 1.4, roughness: 0.95 }));
  }

  private weedMaterial(color: number): MeshStandardMaterial {
    return this.material(`weed-${color}`, () => new MeshStandardMaterial({ color, map: SeaTextures.weed(), roughness: 0.6 }));
  }

  private speckle(root: Object3D): void {
    root.traverse((part) => {
      if (!(part instanceof Mesh) || !(part.material instanceof MeshStandardMaterial)) return;
      const color = part.material.color.getHex();
      part.material = this.material(`speckle-${color}`, () => new MeshStandardMaterial({ color, map: SeaTextures.speckle(), roughness: 0.7 }));
    });
  }

  private rockColumn(toy: Toy, radius: number, depth: number): Group {
    const column = new Group();
    const core = new Mesh(new CylinderGeometry(radius * 0.72, radius * 0.4, depth, 16), this.rockMaterial(1));
    core.position.y = -depth / 2;
    column.add(core);
    const tiers = 6;
    for (let tier = 0; tier < tiers; tier += 1) {
      const ring = radius * (0.86 - tier * 0.07);
      const y = -0.5 - ((tier + 0.5) / tiers) * (depth - 0.5);
      const count = 6 + (tier % 2);
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + tier * 0.6 + this.rng.between(-0.2, 0.2);
        const size = Math.min(Math.max(1.1, ring * this.rng.between(0.36, 0.52)), Math.max(0.7, -y - 0.5));
        const boulder = toy.ball(size, ROCK_COLORS[(tier + index) % ROCK_COLORS.length] as number, [Math.cos(angle) * ring, y + this.rng.between(-0.2, 0.2), Math.sin(angle) * ring]);
        boulder.scale.set(1.1, 0.85, 1);
        boulder.material = this.rockMaterial(tier + index);
        column.add(boulder);
      }
    }
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + 0.4;
      const base = toy.ball(this.rng.between(1.1, 1.8), ROCK_COLORS[index % ROCK_COLORS.length] as number, [Math.cos(angle) * radius * 0.8, -depth + 0.6, Math.sin(angle) * radius * 0.8]);
      base.scale.y = 0.7;
      base.material = this.rockMaterial(index);
      column.add(base);
    }
    return column;
  }

  private island(toy: Toy, x: number, y: number, z: number, radius: number, grass: number): Group {
    const island = new Group();
    const depth = TOP - FLOOR;
    const beach = new Mesh(new TorusGeometry(radius, 0.3, 10, 40), toy.clay.get(0xfff0c9));
    beach.rotation.x = Math.PI / 2;
    beach.position.y = 0.3;
    const rock = this.rockColumn(toy, radius, depth);
    const foam = new Mesh(new TorusGeometry(radius + 0.9, 0.16, 8, 48), toy.clay.get(0xffffff));
    foam.rotation.x = Math.PI / 2;
    foam.position.set(x, WATER + 0.05, z);
    this.foam.push(foam);
    const top = toy.cylinder(radius, radius, 0.9, grass);
    this.speckle(top);
    this.speckle(beach);
    island.add(top, beach, rock, new GrassField({ seed: `isla-${x}-${z}`, radius: radius - 0.5, y: TOP, scale: 1.1, density: 5 }).group);
    island.position.set(x, y, z);
    this.group.add(island, foam);
    return island;
  }

  private seaLife(toy: Toy): void {
    for (let index = 0; index < WEEDS; index += 1) this.addWeed(toy, this.rng.between(-36, 36), this.rng.between(-24, 14), index);
    for (let index = 0; index < 12; index += 1) this.addCoral(toy, this.rng.between(-34, 34), this.rng.between(-22, 12), index);
    [[-27, -12, 1.4], [27, -10, 1.7], [-6, -20, 1.1], [34, 4, 1.2]].forEach(([x, z, scale]) => this.addRocks(toy, x as number, z as number, scale as number));
    for (let index = 0; index < 7; index += 1) this.addShell(toy, this.rng.between(-30, 30), this.rng.between(-14, 12), index);
    for (let index = 0; index < SCHOOL; index += 1) this.addSchoolFish(toy, index);
    this.addTurtle(toy);
    for (let index = 0; index < 9; index += 1) this.addFish(toy, index);
    this.addLeaper(toy, -9, -2, 7, 0);
    this.addLeaper(toy, 21, 12, 12, 1);
    this.addMermaid(toy, -19.5, 9, 0xff8fb7, 0x2fc4b2, false, 0, true);
    this.addMermaid(toy, -29, 3, 0xffe35c, 0xb89cf2, false, 2.2, true);
    this.addMermaid(toy, 5, -2, 0x7a58c9, 0xff8fb7, true, 4.4, false);
    for (let index = 0; index < BUBBLES; index += 1) {
      const mesh = new Mesh(new SphereGeometry(0.28, 10, 8), new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1 }));
      this.bubbles.push({ mesh, x: this.rng.between(-28, 28), z: this.rng.between(-14, 12), speed: this.rng.between(0.06, 0.14), phase: this.rng.between(0, 1) });
      this.group.add(mesh);
    }
  }

  private addWeed(toy: Toy, x: number, z: number, index: number): void {
    const color = WEED_COLORS[index % WEED_COLORS.length] as number;
    const height = this.rng.between(0.5, 1);
    const root = new Group();
    let parent = root;
    const segments: Group[] = [];
    for (let part = 0; part < 6; part += 1) {
      const segment = new Group();
      segment.position.y = part === 0 ? 0 : 1.3 * height;
      const blade = toy.ball(0.55 - part * 0.06, color);
      blade.scale.set(1, 1.5 * height, 0.45);
      blade.material = this.weedMaterial(color);
      blade.position.y = 0.65 * height;
      segment.add(blade);
      parent.add(segment);
      segments.push(segment);
      parent = segment;
    }
    root.position.set(x, FLOOR, z);
    this.weeds.push({ segments, phase: index * 0.9 });
    this.group.add(root);
  }

  private addCoral(toy: Toy, x: number, z: number, index: number): void {
    const coral = new Group();
    if (index % 3 === 2) {
      coral.add(toy.ball(1.2, 0xa24bd1, [0, 0.7, 0]));
      coral.children[0]?.scale.set(1, 0.8, 1);
      for (let bump = 0; bump < 7; bump += 1) {
        const angle = (bump / 7) * Math.PI * 2;
        coral.add(toy.ball(0.32, 0xc47be6, [Math.cos(angle) * 0.85, 0.9 + (bump % 2) * 0.35, Math.sin(angle) * 0.85]));
      }
    } else {
      const color = CORAL_COLORS[index % CORAL_COLORS.length] as number;
      coral.add(toy.cylinder(0.3, 0.4, 1.8, color, [0, 0.9, 0]));
      [-0.7, -0.25, 0.25, 0.7].forEach((tilt, branch) => {
        const arm = toy.cylinder(0.14, 0.2, 1.4 + (branch % 2) * 0.5, color, [tilt * 0.9, 2.2, 0]);
        arm.rotation.z = -tilt;
        coral.add(arm, toy.ball(0.24, color, [tilt * 1.5, 2.9 + (branch % 2) * 0.3, 0]));
      });
    }
    this.speckle(coral);
    coral.position.set(x, FLOOR, z);
    coral.scale.setScalar(this.rng.between(1, 1.7));
    this.group.add(coral);
  }

  private addRocks(toy: Toy, x: number, z: number, scale: number): void {
    const pile = new Group();
    [[2.6, 0], [2.1, 1.5], [1.6, 2.9], [1.1, 4]].forEach(([radius, y], tier) => {
      const rock = toy.ball(radius as number, ROCK_COLORS[tier % ROCK_COLORS.length] as number, [(tier % 2) * 0.35, (y as number) + 0.6, 0]);
      rock.scale.set(1.15, 0.75, 1);
      rock.material = this.rockMaterial(tier);
      pile.add(rock);
    });
    pile.position.set(x, FLOOR, z);
    pile.scale.setScalar(scale);
    this.group.add(pile);
  }

  private addShell(toy: Toy, x: number, z: number, index: number): void {
    const shell = new Group();
    if (index % 2 === 0) {
      const body = toy.ball(0.9, 0xff9bb5);
      body.scale.set(1, 0.45, 0.8);
      shell.add(body, toy.ball(0.3, 0xffffff, [0, 0.35, 0.1]));
    } else {
      for (let arm = 0; arm < 5; arm += 1) {
        const spoke = toy.ball(0.28, 0xff8a3d, [Math.cos((arm / 5) * Math.PI * 2) * 0.6, 0.1, Math.sin((arm / 5) * Math.PI * 2) * 0.6]);
        spoke.scale.set(1.8, 0.4, 0.8);
        spoke.rotation.y = -(arm / 5) * Math.PI * 2;
        shell.add(spoke);
      }
      shell.add(toy.ball(0.38, 0xff8a3d, [0, 0.1, 0]));
    }
    this.speckle(shell);
    shell.position.set(x, FLOOR + 0.3, z);
    shell.rotation.y = index * 1.3;
    this.group.add(shell);
  }

  private addSchoolFish(toy: Toy, index: number): void {
    const { group, tail } = this.fishModel(toy, 0x5b7fa8, 0x8fb3d9);
    group.scale.setScalar(0.38);
    this.swimmers.push({ group, tail, cx: 0, cz: -17 + (index % 4), rx: 22, rz: 2, depth: -2.6 - (index % 5) * 0.55, speed: 0.1, phase: index * 0.09 + (index % 3) * 0.12 });
    this.group.add(group);
  }

  private addTurtle(toy: Toy): void {
    const shell = toy.ball(1.8, 0x8a5a2c);
    shell.scale.set(1.15, 0.65, 0.95);
    this.turtle.add(shell, toy.ball(0.7, 0xa8733a, [0, 0.95, 0]), toy.ball(0.55, 0xa8733a, [0.9, 0.7, 0]), toy.ball(0.55, 0xa8733a, [-0.9, 0.7, 0]));
    this.turtle.add(toy.ball(0.62, 0x6fbf73, [2.3, 0.15, 0]), toy.ball(0.1, 0x2a1730, [2.7, 0.4, 0.3]), toy.ball(0.1, 0x2a1730, [2.7, 0.4, -0.3]), toy.ball(0.3, 0x6fbf73, [-2.2, -0.1, 0]));
    [[1.2, 0.9], [1.2, -0.9], [-1.2, 0.9], [-1.2, -0.9]].forEach(([x, z]) => {
      const flipper = new Group();
      const paddle = toy.ball(0.6, 0x6fbf73, [0, 0, (z as number) * 0.5]);
      paddle.scale.set(1.4, 0.3, 0.7);
      flipper.add(paddle);
      flipper.position.set(x as number, -0.2, z as number);
      this.flippers.push(flipper);
      this.turtle.add(flipper);
    });
    this.turtle.position.set(0, -4.4, -12);
    this.group.add(this.turtle);
  }

  private fishModel(toy: Toy, body: number, accent: number): { group: Group; tail: Group } {
    const group = new Group();
    const torso = toy.ball(0.9, body);
    torso.scale.set(1.5, 0.85, 0.55);
    torso.material = this.material(`belly-${body}`, () => new MeshStandardMaterial({ color: body, map: SeaTextures.belly(), roughness: 0.5 }));
    const fin = toy.ball(0.4, accent, [0, 0.7, 0]);
    fin.scale.set(1, 0.7, 0.25);
    const tail = new Group();
    const blade = new Mesh(new CylinderGeometry(0, 0.7, 1, 3), toy.clay.get(accent));
    blade.rotation.z = Math.PI / 2;
    blade.position.x = -0.5;
    tail.add(blade);
    tail.position.x = -1.3;
    group.add(torso, fin, tail, toy.ball(0.17, 0xffffff, [0.85, 0.2, 0.32]), toy.ball(0.08, 0x2a1730, [0.95, 0.2, 0.36]), toy.ball(0.17, 0xffffff, [0.85, 0.2, -0.32]), toy.ball(0.08, 0x2a1730, [0.95, 0.2, -0.36]));
    return { group, tail };
  }

  private addFish(toy: Toy, index: number): void {
    const [body, accent] = FISH_COLORS[index % FISH_COLORS.length] as readonly [number, number];
    const { group, tail } = this.fishModel(toy, body, accent);
    group.scale.setScalar(this.rng.between(0.7, 1.1));
    this.swimmers.push({ group, tail, cx: this.rng.between(-18, 18), cz: this.rng.between(-10, 8), rx: this.rng.between(6, 14), rz: this.rng.between(3, 7), depth: this.rng.between(-6.5, -2), speed: this.rng.between(0.18, 0.36) * (index % 2 === 0 ? 1 : -1), phase: index * 1.4 });
    this.group.add(group);
    Toy.register(this.interactives, `pez-${index}`, group, (now, point) => {
      void now;
      this.confetti.burst(point, 15);
    });
  }

  private addLeaper(toy: Toy, from: number, to: number, z: number, index: number): void {
    const { group } = this.fishModel(toy, index === 0 ? 0xff8fb7 : 0xffb066, 0xffe35c);
    group.scale.setScalar(1.15);
    this.leapers.push({ group, from, to, z, period: 7 + index * 2.5, phase: index * 3.3 });
    this.group.add(group);
  }

  private addMermaid(toy: Toy, x: number, z: number, hair: number, tailColor: number, swims: boolean, phase: number, onRock: boolean): void {
    const group = new Group();
    const pose = new Group();
    const tail = new Group();
    const upperTail = toy.ball(0.7, tailColor, [0, -0.7, 0]);
    upperTail.scale.set(0.8, 1.4, 0.8);
    const lowerTail = toy.ball(0.5, tailColor, [0, -1.9, 0.1]);
    lowerTail.scale.set(0.7, 1.4, 0.7);
    const fin = new Group();
    [-1, 1].forEach((side) => {
      const lobe = toy.ball(0.6, tailColor, [side * 0.5, -3.0, 0.1]);
      lobe.scale.set(0.55, 1, 0.25);
      lobe.rotation.z = side * 0.5;
      fin.add(lobe);
    });
    tail.add(upperTail, lowerTail, fin);
    const arm = new Group();
    const limb = toy.cylinder(0.14, 0.14, 1.3, 0xffd0b0, [0, 0.65, 0]);
    arm.add(limb, toy.ball(0.2, 0xffd0b0, [0, 1.35, 0]));
    arm.position.set(0.55, 1.15, 0);
    pose.add(
      tail,
      toy.cylinder(0.5, 0.55, 1.3, 0xffd0b0, [0, 0.65, 0]),
      toy.ball(0.24, 0xffb3cf, [-0.26, 1.0, 0.42]),
      toy.ball(0.24, 0xffb3cf, [0.26, 1.0, 0.42]),
      toy.ball(0.6, 0xffd0b0, [0, 1.85, 0]),
      toy.ball(0.72, hair, [0, 1.95, -0.2]),
      toy.ball(0.28, hair, [-0.62, 1.4, 0.05]),
      toy.ball(0.28, hair, [0.62, 1.4, 0.05]),
      toy.ball(0.07, 0x2a1730, [-0.2, 1.9, 0.52]),
      toy.ball(0.07, 0x2a1730, [0.2, 1.9, 0.52]),
      arm,
    );
    group.add(pose);
    const y = onRock ? WATER + 3.5 : -4.5;
    group.position.set(x, y, z);
    group.scale.setScalar(1.2);
    if (onRock) {
      const rock = toy.ball(2.4, 0x9aa5b1, [x, WATER + 0.2, z]);
      rock.scale.set(1, 0.8, 0.85);
      this.group.add(rock);
    }
    this.group.add(group);
    const entry: Mermaid = { group, pose, tail, arm, base: new Vector3(x, y, z), phase, hitAt: -10, swims };
    this.mermaids.push(entry);
    Toy.register(this.interactives, `sirena-${this.mermaids.length}`, group, (now, point) => {
      entry.hitAt = now;
      this.confetti.burst(point, 40);
    });
  }

  private hopper(island: Group, object: Group, id: string, x: number, z: number, scale = 1, confetti = 30): void {
    object.position.set(x, TOP, z);
    object.scale.setScalar(scale);
    island.add(object);
    const entry: Floater = { group: object, base: new Vector3(x, TOP, z), phase: this.rng.between(0, 6), hitAt: -10 };
    this.hoppers.push(entry);
    Toy.register(this.interactives, id, object, (now, point) => {
      entry.hitAt = now;
      this.confetti.burst(point, confetti);
    });
  }

  private addBear(island: Group, bears: BearBuilder, seed: number, x: number, z: number): void {
    const bear = new GuardianBear(bears, seed, 0.55, false);
    bear.group.position.set(x, TOP, z);
    island.add(bear.group);
    const entry = { bear, hitAt: -10 };
    this.bears.push(entry);
    Toy.register(this.interactives, `osito-${seed}`, bear.group, (now) => {
      entry.hitAt = now;
      bear.poke(now);
    });
  }

  private bakery(toy: Toy, bears: BearBuilder, island: Group): void {
    const tiers: [number, number, number, number][] = [[3.3, 1.9, 0xffb3cf, 0.95], [2.5, 1.6, 0xfff0d6, 2.7], [1.7, 1.3, 0xffb3cf, 4.2]];
    tiers.forEach(([radius, height, color, y]) => {
      this.cake.add(toy.cylinder(radius, radius, height, color, [0, y, 0]));
      const drip = new Mesh(new TorusGeometry(radius, 0.22, 10, 36), toy.clay.get(0xffffff));
      drip.rotation.x = Math.PI / 2;
      drip.position.y = y + height / 2;
      this.cake.add(drip);
    });
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      this.cake.add(toy.ball(0.36, 0xff4f6d, [Math.cos(angle) * 1.2, 5.1, Math.sin(angle) * 1.2]));
    }
    const flame = new Mesh(new SphereGeometry(0.28, 12, 10), this.flameMaterial);
    flame.position.y = 6.2;
    this.flames.unshift(flame);
    this.cake.add(toy.cylinder(0.14, 0.14, 1.1, 0x7fd0ea, [0, 5.4, 0]), flame);
    this.cake.position.set(-1.6, TOP, -0.5);
    this.cake.scale.setScalar(0.85);
    island.add(this.cake);
    Toy.register(this.interactives, "pastel", this.cake, (now, point) => {
      this.cakeHitAt = now;
      this.confetti.burst(point, 60);
    });

    [[3.2, 2, 0x7fd0ea, 0xffe35c], [4.9, 0.6, 0xffb3cf, 0xb89cf2]].forEach(([x, z, liner, frosting], index) => {
      const cupcake = new Group();
      cupcake.add(toy.cylinder(1.05, 0.7, 1.2, liner as number, [0, 0.6, 0]));
      const cream = toy.ball(1.05, frosting as number, [0, 1.45, 0]);
      cream.scale.y = 0.8;
      cupcake.add(cream, toy.ball(0.3, 0xff4f6d, [0, 2.3, 0]));
      this.hopper(island, cupcake, `cupcake-${index}`, x as number, z as number, 0.9);
    });

    const bowl = new Group();
    bowl.add(new Mesh(new SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new MeshStandardMaterial({ color: 0x7fd0ea, roughness: 0.5, side: DoubleSide })));
    bowl.children[0]?.position.set(0, 2.2, 0);
    const batter = new Mesh(new CircleGeometry(1.95, 28), toy.clay.get(0xfff0c9));
    batter.rotation.x = -Math.PI / 2;
    batter.position.y = 1.5;
    const whisk = new Group();
    whisk.add(toy.cylinder(0.14, 0.14, 2.4, 0xc9d1d9, [0, 1.5, 0]));
    [0.5, 0.9].forEach((size) => {
      const loop = new Mesh(new TorusGeometry(size, 0.06, 8, 24), toy.clay.get(0xc9d1d9));
      loop.position.y = 0.1;
      whisk.add(loop);
    });
    whisk.position.set(0.6, 3.4, 0);
    whisk.rotation.z = -0.4;
    bowl.add(batter, whisk);
    this.hopper(island, bowl, "tazon", -4.4, 2.6, 0.8);

    const pin = new Group();
    const roller = toy.cylinder(0.85, 0.85, 4.6, 0xd9a066);
    roller.rotation.z = Math.PI / 2;
    pin.add(roller);
    [-3.1, 3.1].forEach((x) => {
      const handle = toy.cylinder(0.32, 0.32, 1.5, 0xb57a46, [x, 0, 0]);
      handle.rotation.z = Math.PI / 2;
      pin.add(handle);
    });
    pin.position.set(1, TOP + 0.85, 4);
    pin.rotation.y = -0.3;
    pin.scale.setScalar(0.7);
    island.add(pin);
    this.addBear(island, bears, 1, 4.7, -2.6);
  }

  private search(toy: Toy, bears: BearBuilder, island: Group): void {
    const ring = new Mesh(new TorusGeometry(2, 0.34, 14, 40), toy.clay.get(0xffb066));
    const lens = new Mesh(new CircleGeometry(2, 36), new MeshStandardMaterial({ color: 0xbfe9f8, transparent: true, opacity: 0.45, roughness: 0.15 }));
    const handle = new Mesh(new CylinderGeometry(0.28, 0.36, 3.2, 14), toy.clay.get(0xc4805a));
    handle.position.y = -3.4;
    this.magnifier.add(ring, lens, handle, toy.cylinder(0.42, 0.42, 1.2, 0xff6b8f, [0, -4.9, 0]));
    this.magnifier.position.set(0, TOP + 3.9, -0.5);
    island.add(this.magnifier);
    Toy.register(this.interactives, "lupa", this.magnifier, (now, point) => {
      this.lensHitAt = now;
      this.confetti.burst(point, 35);
    });

    for (let index = 0; index < PRINTS; index += 1) {
      const side = index % 2 === 0 ? 0.5 : -0.5;
      const along = index / (PRINTS - 1);
      const print = toy.ball(0.6, 0xc4805a, [-4 + along * 8, TOP + 0.05, 3.4 - Math.sin(along * Math.PI) * 1.4 + side]);
      print.scale.set(1, 0.12, 1.4);
      this.prints.push(print);
      island.add(print);
    }

    QUESTION_COLORS.forEach((color, index) => {
      const mark = new Group();
      const hook = new Mesh(new TorusGeometry(0.7, 0.22, 10, 28, Math.PI * 1.45), toy.clay.get(color));
      hook.position.y = 1.2;
      mark.add(hook, toy.cylinder(0.22, 0.22, 0.7, color, [0.28, 0.2, 0]), toy.ball(0.27, color, [0.28, -0.5, 0]));
      const base = new Vector3(-4 + index * 4, 8 + (index % 2) * 1.6, -2 + index);
      mark.position.copy(base);
      mark.scale.setScalar(1.3);
      const entry: Floater = { group: mark, base, phase: index * 1.7, hitAt: -10 };
      this.questions.push(entry);
      island.add(mark);
      Toy.register(this.interactives, `pregunta-${index}`, mark, (now, point) => {
        entry.hitAt = now;
        this.confetti.burst(point, 25);
      });
    });

    const bush = new Group();
    [[-1, 0.7, 1.3], [0, 0.95, 1.6], [1.1, 0.7, 1.2]].forEach(([dx, dy, radius], part) => {
      bush.add(toy.ball(radius as number, part === 1 ? 0x7cc88a : 0x86d6a8, [dx as number, (dy as number) + TOP, 0]));
    });
    bush.position.set(-4.2, 0, -2.6);
    island.add(bush);
    this.addBear(island, bears, 2, -4.2, -3.6);
  }

  private workshop(toy: Toy, island: Group): void {
    const toolbox = new Group();
    toolbox.add(toy.box([3.2, 1.6, 1.9], 0xff6b6b, [0, 0.8, 0], 0.35), toy.box([3.3, 0.3, 2], 0xc4235f, [0, 1.65, 0], 0.12));
    const grip = new Mesh(new TorusGeometry(0.7, 0.14, 8, 20, Math.PI), toy.clay.get(0x9aa5b1));
    grip.position.y = 1.8;
    toolbox.add(grip);
    this.hopper(island, toolbox, "caja-herramientas", -1.2, 0.4, 0.95);

    const hammer = new Group();
    const shaft = toy.cylinder(0.2, 0.2, 3, 0xc4805a);
    shaft.rotation.z = Math.PI / 2;
    hammer.add(shaft, toy.box([0.9, 1.4, 1], 0x9aa5b1, [1.5, 0, 0], 0.2));
    hammer.position.set(1.2, TOP + 0.3, 2.2);
    hammer.rotation.y = 0.6;
    island.add(hammer);

    const bulb = new Group();
    bulb.add(new Mesh(new SphereGeometry(0.95, 18, 14), this.bulbMaterial), toy.cylinder(0.45, 0.45, 0.7, 0x9aa5b1, [0, -1, 0]));
    bulb.children[0]?.position.set(0, 0.4, 0);
    this.hopper(island, bulb, "foco", 2.2, -1.6, 1.1, 40);

    const wrench = new Group();
    const arm = toy.box([0.45, 3, 0.4], 0xc9d1d9, [0, 0, 0], 0.15);
    const jaw = new Mesh(new TorusGeometry(0.55, 0.2, 8, 18, Math.PI * 1.5), toy.clay.get(0xc9d1d9));
    jaw.position.y = 1.7;
    wrench.add(arm, jaw);
    wrench.position.set(-3, TOP + 0.3, -1.4);
    wrench.rotation.set(Math.PI / 2, 0, 0.8);
    island.add(wrench);
  }

  private camp(toy: Toy, bears: BearBuilder, island: Group): void {
    const tent = new Group();
    const body = new Mesh(new CylinderGeometry(0, 2.9, 3.2, 4), toy.clay.get(0xff8fb7));
    body.position.y = 1.6;
    body.rotation.y = Math.PI / 4;
    tent.add(body, toy.box([1.1, 1.5, 0.15], 0x8a5a7a, [0, 0.75, 1.55], 0.07));
    this.hopper(island, tent, "carpa", -1.8, -0.8, 0.95);

    const fire = new Group();
    [0, 1.05, 2.1].forEach((angle) => {
      const log = toy.cylinder(0.22, 0.22, 1.8, 0xb57a46, [0, 0.25, 0]);
      log.rotation.set(Math.PI / 2, 0, angle);
      fire.add(log);
    });
    const flame = new Mesh(new CylinderGeometry(0, 0.55, 1.5, 8), this.flameMaterial);
    flame.position.y = 1.1;
    this.flames.push(flame);
    fire.add(flame);
    fire.position.set(1.9, TOP, 1.6);
    island.add(fire);

    const lantern = new Group();
    lantern.add(toy.cylinder(0.35, 0.35, 0.9, 0x7fd0ea, [0, 0.45, 0]), new Mesh(new SphereGeometry(0.34, 12, 10), this.bulbMaterial));
    lantern.children[1]?.position.set(0, 1.05, 0);
    this.hopper(island, lantern, "farol", -3.4, 2.3, 1);

    const pack = new Group();
    pack.add(toy.box([1.5, 1.9, 1], 0x7fd0ea, [0, 0.95, 0], 0.35), toy.box([1.1, 0.8, 0.3], 0xffe35c, [0, 0.6, 0.55], 0.12));
    this.hopper(island, pack, "mochila-campo", 3.3, -1.4, 0.9);
    this.addBear(island, bears, 3, 0.4, 2.7);
  }

  private checklist(toy: Toy, island: Group): void {
    const board = new Group();
    board.add(toy.box([7.4, 9.6, 0.6], 0xc4805a, [0, 5, 0], 0.25), toy.box([6.2, 8.4, 0.2], 0xfffaf2, [0, 4.8, 0.4], 0.08), toy.box([2.6, 1.1, 0.5], 0x9aa5b1, [0, 9.5, 0.55], 0.2));
    for (let index = 0; index < CHECKS; index += 1) {
      const y = 7.6 - index * 1.9;
      board.add(toy.box([0.95, 0.95, 0.25], 0xd8cfe0, [-2, y, 0.62], 0.12), toy.box([3, 0.22, 0.2], 0xc9bfd4, [0.9, y, 0.62], 0.08));
      const tick = new Group();
      [[0.55, 0.12, -0.7, -0.3], [1.5, -0.7, 0.35, 0.18]].forEach(([length, rotation, x, ty]) => {
        const arm = toy.box([0.3, length as number, 0.22], 0x3d9b68, [x as number, ty as number, 0.05], 0.1);
        arm.rotation.z = rotation as number;
        tick.add(arm);
      });
      tick.position.set(-2, y, 0.78);
      this.ticks.push(tick);
      board.add(tick);
    }
    const pencil = new Group();
    pencil.add(toy.cylinder(0.22, 0.22, 3, 0xffe35c), toy.cylinder(0, 0.22, 0.7, 0xffd0a0, [0, -1.8, 0]));
    pencil.position.set(4.6, 2.4, 0.9);
    pencil.rotation.z = -0.3;
    board.add(pencil);
    board.position.set(0, TOP, -0.4);
    board.rotation.y = -0.15;
    board.scale.setScalar(0.62);
    island.add(board);
    Toy.register(this.interactives, "lista", board, (now, point) => {
      this.checksStart = now;
      this.confetti.burst(point, 40);
    });
  }

  private garden(toy: Toy, island: Group): void {
    const colors = [0xff8fb7, 0xffe35c, 0xb89cf2];
    colors.forEach((color, index) => {
      const flower = new Group();
      flower.add(toy.cylinder(0.1, 0.1, 1.8, 0x5fb87a, [0, 0.9, 0]), toy.ball(0.34, 0xffd43b, [0, 1.9, 0]));
      for (let petal = 0; petal < 6; petal += 1) {
        const angle = (petal / 6) * Math.PI * 2;
        flower.add(toy.ball(0.3, color, [Math.cos(angle) * 0.5, 1.9, Math.sin(angle) * 0.5]));
      }
      flower.position.set(-2 + index * 1.7, TOP, -1.6 + (index % 2) * 0.8);
      this.flowers.push(flower);
      island.add(flower);
      Toy.register(this.interactives, `flor-${index}`, flower, (now, point) => {
        void now;
        this.confetti.burst(point, 20);
      });
    });
    const can = new Group();
    can.add(toy.cylinder(0.8, 0.9, 1.2, 0x7fd0ea, [0, 0.6, 0]));
    const spout = toy.cylinder(0.14, 0.2, 1.4, 0x7fd0ea, [0.95, 1, 0]);
    spout.rotation.z = -0.9;
    const handle = new Mesh(new TorusGeometry(0.5, 0.1, 8, 18, Math.PI), toy.clay.get(0x2f8fb0));
    handle.position.set(-0.6, 0.9, 0);
    handle.rotation.z = Math.PI / 2;
    can.add(spout, handle);
    this.hopper(island, can, "regadera", 1.5, 1.3, 0.9);
    const tree = new TreeFactory(this.rng).build(2.2, -1.8, 1, false);
    tree.position.y += TOP;
    island.add(tree);
  }

  private addBalloon(toy: Toy, index: number): void {
    const balloon = new Group();
    const body = toy.ball(1.2, BALLOON_COLORS[index % BALLOON_COLORS.length] as number);
    body.scale.y = 1.25;
    balloon.add(body, toy.cylinder(0.05, 0.05, 4, 0xffffff, [0, -3.3, 0]));
    const base = new Vector3(-26 + index * 13 + this.rng.between(-2, 2), 11 + (index % 2) * 3, -12 + this.rng.between(-2, 2));
    balloon.position.copy(base);
    const entry: Floater = { group: balloon, base, phase: index * 1.6, hitAt: -10 };
    this.balloons.push(entry);
    this.group.add(balloon);
    Toy.register(this.interactives, `globo-${index}`, balloon, (now, point) => {
      entry.hitAt = now;
      this.confetti.burst(point, 25);
    });
  }

  private addStar(index: number): void {
    const mesh = new Mesh(StarGeometry.build(), this.starMaterial);
    mesh.scale.setScalar(0.8);
    const base = new Vector3(-24 + index * 12 + this.rng.between(-2, 2), 15 + this.rng.between(0, 4), -14);
    mesh.position.copy(base);
    this.stars.push({ mesh, base, phase: index * 1.3 });
    this.group.add(mesh);
  }
}
