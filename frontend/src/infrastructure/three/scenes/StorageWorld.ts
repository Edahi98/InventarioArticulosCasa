import { Group, Mesh, MeshStandardMaterial, PointLight, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { StarGeometry } from "../StarGeometry.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

export type StorageVariant = "almacen" | "empaque";

const GROUND = -6.5;
const COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8, 0xffb066] as const;
const BELT = { x: 12.5, length: 16, y: 2.6, z: -5 };

interface Parcel {
  group: Group;
  offset: number;
  hitAt: number;
}

export class StorageWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = false;
  private readonly lamp = new Group();
  private readonly bulb = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 1 });
  private readonly light = new PointLight(0xffd9a0, 80, 70, 2);
  private readonly sitter: GuardianBear;
  private readonly helper: GuardianBear;
  private readonly crates: { group: Group; hitAt: number; baseY: number }[] = [];
  private readonly parcels: Parcel[] = [];
  private readonly stars: { mesh: Mesh; offset: number }[] = [];
  private readonly starMaterial = new MeshStandardMaterial({ color: 0xffd43b, emissive: 0xffb300, emissiveIntensity: 0.7, roughness: 0.35 });
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("almacen");
  private lampHitAt = -10;

  /**
   * Un cuarto de guardado: pared de color con zócalo, piso de tablones, estantes llenos de cajas, frascos y pelotas,
   * cajas apiladas, una escalera, un foco que se mece y ositos ayudando. En la variante `empaque` el estante de la
   * derecha se cambia por una banda transportadora con paquetes que viajan y una caja abierta de la que brotan
   * estrellas. Son los fondos de las pantallas de cuartos y artículos.
   *
   * @param variant - `almacen` para ver y consultar, `empaque` para guardar algo nuevo.
   */
  constructor(variant: StorageVariant = "almacen") {
    const clay = new ClayMaterials();
    const toy = new Toy(clay);
    const bears = new BearBuilder();
    this.group.position.y = GROUND;
    this.group.add(this.confetti.mesh, ...this.room(toy), this.shelves(toy, -14, 0), this.crateStack(toy), this.hangingLamp(toy));
    if (variant === "almacen") this.group.add(this.shelves(toy, 14, 1), this.ladder(toy));
    else this.group.add(...this.conveyor(toy));

    this.sitter = new GuardianBear(bears, 1, 0.8, false);
    this.sitter.group.position.set(-13, 7.7, -9.2);
    this.helper = new GuardianBear(bears, 3, 0.95, true);
    this.helper.group.position.set(variant === "almacen" ? 7 : 3, 0, -3);
    this.group.add(this.sitter.group, this.helper.group);
    Toy.register(this.interactives, "foco", this.lamp, (now) => {
      this.lampHitAt = now;
    });
    this.interactives.push({ id: "osito", object: this.helper.group, hit: (now) => this.helper.poke(now) });
    this.helper.group.userData.interactiveId = "osito";
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Mece el foco, mueve la banda con sus paquetes, hace brotar estrellas de la caja y anima a los ositos.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const shake = Math.max(0, 1 - (elapsed - this.lampHitAt) / 2.2);
    this.lamp.rotation.z = Math.sin(t * 1.1) * 0.05 + Math.sin(elapsed * 6) * shake * 0.25;
    this.bulb.emissiveIntensity = 0.9 + night * 0.8;
    this.light.intensity = 70 + night * 70;
    this.crates.forEach((crate) => {
      const hop = Math.max(0, 1 - (elapsed - crate.hitAt) / 0.7);
      crate.group.position.y = crate.baseY + Math.abs(Math.sin(hop * Math.PI * 2)) * hop * 1.2;
    });
    this.parcels.forEach((parcel) => {
      const progress = ((((t * 0.1 + parcel.offset) % 1) + 1) % 1) * BELT.length;
      const hop = Math.max(0, 1 - (elapsed - parcel.hitAt) / 0.7);
      parcel.group.position.set(BELT.x - BELT.length / 2 + progress, BELT.y + 1.1 + Math.abs(Math.sin(hop * Math.PI * 2)) * hop, BELT.z);
    });
    this.stars.forEach((star) => {
      const rise = (((t * 0.45 + star.offset) % 1) + 1) % 1;
      star.mesh.position.set(5.2 + Math.sin(rise * 6 + star.offset * 9) * 0.8, BELT.y + 2.4 + rise * 5, BELT.z + Math.cos(star.offset * 9));
      star.mesh.scale.setScalar(Math.sin(rise * Math.PI) * 0.7);
      star.mesh.rotation.y = t * 2;
    });
    this.sitter.update(elapsed, moving && Math.sin(t * 0.5) > 0.75 ? 1 : 0, moving);
    this.helper.update(elapsed, 0, moving);
    this.confetti.update(0.016);
  }

  private room(toy: Toy): Mesh[] {
    const planks = Array.from({ length: 12 }, (_, index) => toy.box([140, 0.04, 0.14], 0xb9855a, [0, 0.02, -12 + index * 3.2], 0.02));
    return [
      toy.box([140, 60, 0.6], 0xffe9d6, [0, 24, -14], 0.1),
      toy.box([140, 8, 0.8], 0xffc9d9, [0, 4, -13.7], 0.1),
      toy.box([140, 0.4, 70], 0xd9a77a, [0, -0.2, 18], 0.1),
      ...planks,
    ];
  }

  private shelves(toy: Toy, x: number, seed: number): Group {
    const unit = new Group();
    const local = new SeededRandom(`estante-${seed}`);
    unit.add(toy.box([0.5, 13, 2.6], 0xc4805a, [-4.2, 6.5, 0], 0.15), toy.box([0.5, 13, 2.6], 0xc4805a, [4.2, 6.5, 0], 0.15));
    [3.4, 7.4, 11.4].forEach((y) => {
      unit.add(toy.box([9, 0.4, 2.8], 0xe0a070, [0, y, 0], 0.15));
      let cursor = -3.6;
      while (cursor < 3.4) {
        const width = local.between(1, 1.9);
        const height = local.between(1, 2.2);
        const kind = local.next();
        const color = local.pick(COLORS);
        const spot: [number, number, number] = [cursor + width / 2, y + 0.2 + height / 2, 0];
        if (kind < 0.5) {
          const box = toy.box([width, height, 1.8], color, spot, 0.25);
          box.add(toy.box([width * 0.7, 0.28, 0.05], 0xfffaf2, [0, 0, 0.92], 0.03));
          unit.add(box);
        } else if (kind < 0.8) {
          unit.add(toy.cylinder(width / 2, width / 2, height, color, spot), toy.cylinder(width / 2 + 0.05, width / 2 + 0.05, 0.25, 0xfffaf2, [spot[0], spot[1] + height / 2 + 0.1, 0]));
        } else {
          unit.add(toy.ball(width / 2, color, [spot[0], y + 0.2 + width / 2, 0]));
        }
        cursor += width + 0.25;
      }
    });
    unit.position.set(x, 0, -11);
    unit.scale.setScalar(1.15);
    return unit;
  }

  private crateStack(toy: Toy): Group {
    const stack = new Group();
    [
      [-3, 0, -9, 3.4, 0xffb066],
      [1, 0, -9.5, 3.8, 0xffd0e0],
      [-1, 3.4, -9.2, 3, 0xc4ecf8],
    ].forEach(([x, y, z, size, color], index) => {
      const crate = new Group();
      crate.add(toy.box([size as number, size as number, size as number], color as number, [0, (size as number) / 2, 0], 0.4));
      crate.add(toy.box([(size as number) * 0.95, 0.3, (size as number) * 1.02], 0xfff6dc, [0, (size as number) * 0.5, 0], 0.1));
      crate.position.set(x as number, y as number, z as number);
      this.crates.push({ group: crate, hitAt: -10, baseY: y as number });
      stack.add(crate);
      Toy.register(this.interactives, `caja-${index}`, crate, (now, point) => {
        const entry = this.crates[index];
        if (entry) entry.hitAt = now;
        this.confetti.burst(point, 25);
      });
    });
    return stack;
  }

  private ladder(toy: Toy): Group {
    const ladder = new Group();
    ladder.add(toy.box([0.3, 13, 0.4], 0xc4805a, [-1.1, 6.5, 0], 0.1), toy.box([0.3, 13, 0.4], 0xc4805a, [1.1, 6.5, 0], 0.1));
    for (let rung = 0; rung < 6; rung += 1) ladder.add(toy.box([2.2, 0.25, 0.3], 0xe0a070, [0, 1.5 + rung * 2, 0], 0.08));
    ladder.position.set(7.5, 0, -8.8);
    ladder.rotation.x = -0.12;
    return ladder;
  }

  private hangingLamp(toy: Toy): Group {
    this.lamp.add(toy.cylinder(0.06, 0.06, 7, 0x6b4a6a, [0, -3.5, 0]), toy.cylinder(0.5, 2, 1.6, 0xffe35c, [0, -7.6, 0]));
    const bulb = toy.ball(0.7, 0xfff6dc, [0, -8.6, 0]);
    bulb.material = this.bulb;
    this.lamp.add(bulb);
    this.light.position.set(0, -8.6, 1);
    this.lamp.add(this.light);
    this.lamp.position.set(0, 26, -7);
    return this.lamp;
  }

  private conveyor(toy: Toy): Group[] {
    const belt = new Group();
    belt.add(toy.box([BELT.length + 2, 0.8, 3.6], 0x6b5a73, [BELT.x, BELT.y, BELT.z], 0.3));
    [-1, 1].forEach((side) => [BELT.x - BELT.length / 2, BELT.x + BELT.length / 2].forEach((x) => belt.add(toy.cylinder(0.3, 0.3, BELT.y, 0xb89cf2, [x, BELT.y / 2, BELT.z + side * 1.3]))));
    for (let index = 0; index < 8; index += 1) this.parcel(toy, belt, index);

    const open = new Group();
    open.add(toy.box([3, 2, 3], 0xc4805a, [0, 1, 0], 0.25), toy.box([3.2, 0.2, 1.5], 0xe0a070, [0, 2.1, 1.7], 0.06), toy.box([3.2, 0.2, 1.5], 0xe0a070, [0, 2.1, -1.7], 0.06));
    open.children[open.children.length - 2]?.rotation.set(-0.9, 0, 0);
    open.children[open.children.length - 1]?.rotation.set(0.9, 0, 0);
    open.position.set(5, BELT.y + 0.4, BELT.z);
    const geometry = StarGeometry.build();
    for (let index = 0; index < 5; index += 1) {
      const mesh = new Mesh(geometry, this.starMaterial);
      this.stars.push({ mesh, offset: index / 5 });
      belt.add(mesh);
    }
    belt.add(open);
    return [belt];
  }

  private parcel(toy: Toy, belt: Group, index: number): void {
    const size = 1.5 + (index % 3) * 0.4;
    const group = new Group();
    const color = COLORS[index % COLORS.length] as number;
    group.add(toy.box([size, size, size], color, [0, 0, 0], 0.25), toy.box([size * 0.22, size * 1.02, size * 1.02], 0xfff6dc, [0, 0, 0], 0.04), toy.box([size * 1.02, size * 1.02, size * 0.22], 0xfff6dc, [0, 0, 0], 0.04));
    const parcel: Parcel = { group, offset: index / 8, hitAt: -10 };
    this.parcels.push(parcel);
    belt.add(group);
    Toy.register(this.interactives, `paquete-${index}`, group, (now, point) => {
      parcel.hitAt = now;
      this.confetti.burst(point, 20);
    });
  }
}
