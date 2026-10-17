import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { HouseFactory } from "../neighborhood/HouseFactory.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { Landscape } from "./Landscape.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

const HOUSE = { x: 9, z: -7, scale: 3.4 };
const GROUND = -5;

export class HouseFrontWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = true;
  private readonly key = new Group();
  private readonly flag = new Group();
  private readonly bears: GuardianBear[];
  private readonly glass: { emissiveIntensity: number };
  private readonly lamps: Mesh[] = [];
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("casa");
  private keyHitAt = -10;
  private flagUp = 0;
  private flagHitAt = -10;

  /**
   * La entrada de la casa: una casita de juguete con la puerta iluminada, un tapete de bienvenida, un buzón, un
   * camino de piedras, faroles, árboles y una llave gigante que flota. Dos ositos reciben a quien llega. Es el
   * fondo de la pantalla de iniciar sesión.
   */
  constructor() {
    const clay = new ClayMaterials();
    const toy = new Toy(clay);
    const bears = new BearBuilder();
    this.group.position.y = GROUND;
    this.group.add(Landscape.meadow(toy), Landscape.vegetation("casa-pasto"), Landscape.hills(toy, "casa-colinas"), this.confetti.mesh);

    const built = new HouseFactory().create(7);
    this.glass = built.glass;
    built.group.position.set(HOUSE.x, 0, HOUSE.z);
    built.group.scale.setScalar(HOUSE.scale);
    const mat = toy.box([1.1, 0.06, 0.6], 0xff8fb7, [built.door.position.x, 0.03, built.door.position.z + 0.75], 0.03);
    built.group.add(mat);
    this.group.add(built.group);

    this.bears = [new GuardianBear(bears, 0, 0.9, false), new GuardianBear(bears, 2, 0.75, false)];
    this.bears[0]?.group.position.set(HOUSE.x - 3.4, 0, HOUSE.z + 5.2);
    this.bears[1]?.group.position.set(HOUSE.x + 3.6, 0, HOUSE.z + 5.6);
    this.bears.forEach((bear, index) => {
      bear.group.rotation.y = index === 0 ? 0.4 : -0.5;
      this.group.add(bear.group);
    });

    this.group.add(...this.path(toy), this.mailbox(toy), ...this.lampPosts(toy), ...this.garden(toy), this.giantKey(toy));
    const trees = new TreeFactory(this.rng);
    [[-15, -8, 1.8], [-10, -13, 2.2], [-19, -3, 1.5], [18, -14, 2], [22, -6, 1.7]].forEach(([x, z, scale]) => {
      this.group.add(trees.build(x as number, z as number, scale as number, this.rng.chance(0.3)));
    });
    Toy.register(this.interactives, "llave", this.key, (now) => {
      this.keyHitAt = now;
      this.confetti.burst(this.key.getWorldPosition(new Vector3()), 60);
    });
    Toy.register(this.interactives, "buzon", this.flag, (now) => {
      this.flagHitAt = now;
    });
    this.interactives.push({
      id: "casa",
      object: built.group,
      hit: (now) => this.bears.forEach((bear) => bear.poke(now)),
    });
    built.group.userData.interactiveId = "casa";
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Mece la llave, saluda con los ositos, enciende los faroles y la ventana de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const spin = Math.max(0, 1 - (elapsed - this.keyHitAt) / 1.4);
    this.key.position.y = 9.5 + Math.sin(t * 0.8) * 0.5;
    this.key.rotation.y = t * 0.6 + spin * spin * Math.PI * 4;
    this.key.rotation.z = Math.sin(t * 0.5) * 0.15;
    this.flagUp = Math.max(0, 1 - (elapsed - this.flagHitAt) / 2.5);
    this.flag.rotation.z = -Math.PI / 2 + (Math.sin(t * 0.7) > 0.9 ? 1.4 : 0) + this.flagUp * 1.4;
    this.glass.emissiveIntensity = 0.55 + night * 0.95;
    this.lamps.forEach((lamp) => {
      (lamp.material as MeshStandardMaterial).emissiveIntensity = 0.3 + night * 1.2;
    });
    this.bears.forEach((bear, index) => bear.update(elapsed, moving && Math.sin(t * 0.6 + index * 2) > 0.8 ? 1 : 0, moving));
    this.confetti.update(0.016);
    if (moving && Math.sin(t * 0.37) > 0.995) this.confetti.burst(new Vector3(HOUSE.x, 8, HOUSE.z + 6), 40);
  }

  private path(toy: Toy): Mesh[] {
    return Array.from({ length: 8 }, (_, index) => {
      const stone = toy.cylinder(0.9, 0.95, 0.08, index % 2 === 0 ? 0xfff0d6 : 0xffd9c7, [HOUSE.x - index * 0.55 + Math.sin(index) * 0.5, 0.04, HOUSE.z + 3.2 + index * 1.7]);
      stone.scale.z = 0.7;
      return stone;
    });
  }

  private mailbox(toy: Toy): Group {
    const mailbox = new Group();
    mailbox.add(toy.cylinder(0.12, 0.14, 2, 0xc4805a, [0, 1, 0]), toy.box([1.6, 1.1, 1.1], 0x7fd0ea, [0, 2.3, 0], 0.4));
    mailbox.add(toy.box([1.3, 0.14, 0.04], 0x2a1730, [0, 2.4, 0.55], 0.02));
    const pole = toy.cylinder(0.04, 0.04, 0.8, 0xff6b8f, [0, 0.4, 0]);
    const plate = toy.box([0.4, 0.25, 0.05], 0xff6b8f, [0.2, 0.75, 0], 0.03);
    this.flag.add(pole, plate);
    this.flag.position.set(0.85, 2.4, 0);
    this.flag.rotation.z = -Math.PI / 2;
    mailbox.add(this.flag);
    mailbox.position.set(2.5, 0, HOUSE.z + 9.5);
    mailbox.scale.setScalar(1.7);
    return mailbox;
  }

  private lampPosts(toy: Toy): Group[] {
    return [HOUSE.x - 9, HOUSE.x + 9].map((x) => {
      const lamp = new Group();
      const bulb = new Mesh(new SphereGeometry(0.4, 14, 10), new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 }));
      bulb.position.y = 3.4;
      this.lamps.push(bulb);
      lamp.add(toy.cylinder(0.1, 0.14, 3.2, 0x6b4a6a, [0, 1.6, 0]), bulb, toy.cylinder(0.5, 0.25, 0.3, 0xb89cf2, [0, 3.8, 0]));
      lamp.position.set(x, 0, HOUSE.z + 7.5);
      return lamp;
    });
  }

  private garden(toy: Toy): Mesh[] {
    const spots: [number, number, number, number][] = [[HOUSE.x - 4.5, HOUSE.z + 2.4, 0.9, 0x7cc88a], [HOUSE.x + 4.6, HOUSE.z + 2.4, 1, 0x86d6a8], [HOUSE.x - 9, HOUSE.z + 3, 0.8, 0x9bdc9f], [HOUSE.x + 9, HOUSE.z + 3.5, 0.9, 0x7cc88a]];
    const bushes = spots.map(([x, z, scale, color]) => {
      const bush = toy.ball(scale, color, [x, scale * 0.6, z]);
      bush.scale.y = 0.8;
      return bush;
    });
    const blooms = spots.flatMap(([x, z, scale], index) => [0xff8fb7, 0xffe35c, 0xffffff].map((color, bloom) => toy.ball(0.16, color, [x + (bloom - 1) * scale * 0.5, scale * 1.15 + (index % 2) * 0.05, z + scale * 0.55])));
    return [...bushes, ...blooms];
  }

  private giantKey(toy: Toy): Group {
    const head = new Mesh(new TorusGeometry(1.5, 0.45, 14, 36), toy.clay.get(0xffe35c));
    const shaft = new Mesh(new CylinderGeometry(0.34, 0.34, 4.4, 14), toy.clay.get(0xffe35c));
    shaft.position.y = -3.3;
    this.key.add(head, shaft, toy.box([1.2, 0.6, 0.5], 0xffe35c, [0.7, -4.4, 0], 0.2), toy.box([0.9, 0.6, 0.5], 0xffe35c, [0.55, -3.4, 0], 0.2));
    this.key.position.set(-11.5, 9.5, -4);
    this.key.scale.setScalar(1.1);
    return this.key;
  }
}
