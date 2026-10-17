import { BufferGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Shape, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { CloudSea } from "../sky/CloudSea.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

const PLANE_COLORS = [0xffffff, 0xffd0e0, 0xc4ecf8, 0xfff3ac, 0xdccffa, 0xc5ecd6] as const;
const BUBBLE_COLORS = [0xffffff, 0xc4ecf8, 0xffd0e0] as const;

interface Flyer {
  group: Group;
  hitAt: number;
  base: Vector3;
  phase: number;
  speed: number;
}

export class PostWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = true;
  private readonly sea = new CloudSea();
  private readonly planes: Flyer[] = [];
  private readonly letters: Flyer[] = [];
  private readonly bubbles: Flyer[] = [];
  private readonly dots: Mesh[][] = [];
  private readonly flag = new Group();
  private readonly carrier: GuardianBear;
  private readonly mailbox = new Group();
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("correo");
  private flagHitAt = -10;

  /**
   * El correo en el cielo: aviones de papel que cruzan y hacen rizos, sobres que flotan con su sello de corazón,
   * globos de conversación con puntitos que se encienden uno a uno, y un buzón gigante sobre las nubes con un
   * osito cartero. Es el fondo de la pantalla de vincular el bot de Telegram.
   */
  constructor() {
    const clay = new ClayMaterials();
    const toy = new Toy(clay);
    const bears = new BearBuilder();
    this.group.add(this.sea.group, this.confetti.mesh);
    const wing = this.wingGeometry();
    for (let index = 0; index < 7; index += 1) this.addPlane(wing, index);
    for (let index = 0; index < 8; index += 1) this.addLetter(toy, index);
    for (let index = 0; index < 4; index += 1) this.addBubble(toy, index);
    this.buildMailbox(toy);
    this.carrier = new GuardianBear(bears, 3, 0.5, false);
    this.carrier.group.position.set(-1.9, 3.1, 0.2);
    this.mailbox.add(this.carrier.group);
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Hace volar los aviones, flotar los sobres y las burbujas, encender los puntitos y mover la banderita.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.sea.update(elapsed, night, moving);
    this.planes.forEach((plane) => {
      const loop = Math.max(0, 1 - (elapsed - plane.hitAt) / 1.4);
      const progress = (((t * plane.speed + plane.phase) / 22) % 1 + 1) % 1;
      const x = -26 + progress * 52;
      const y = plane.base.y + Math.sin(progress * Math.PI * 4 + plane.phase) * 1.4;
      const slope = Math.cos(progress * Math.PI * 4 + plane.phase) * 1.4 * Math.PI * 4 / 52;
      plane.group.position.set(x, y, plane.base.z);
      plane.group.rotation.set(Math.sin(t * 2 + plane.phase) * 0.25 + loop * Math.PI * 2, 0, Math.atan(slope));
    });
    this.letters.forEach((letter) => {
      const spin = Math.max(0, 1 - (elapsed - letter.hitAt) / 1);
      letter.group.position.set(letter.base.x + Math.sin(t * 0.3 + letter.phase) * 1.2, letter.base.y + Math.sin(t * 0.8 + letter.phase) * 0.7, letter.base.z);
      letter.group.rotation.set(0, Math.sin(t * 0.4 + letter.phase) * 0.5 + spin * Math.PI * 2, Math.sin(t * 0.6 + letter.phase) * 0.2);
    });
    this.bubbles.forEach((bubble, index) => {
      const pulse = Math.max(0, 1 - (elapsed - bubble.hitAt) / 0.8);
      bubble.group.position.set(bubble.base.x, bubble.base.y + Math.sin(t * 0.7 + bubble.phase) * 0.6, bubble.base.z);
      bubble.group.scale.setScalar(1 + pulse * Math.sin(pulse * Math.PI) * 0.25);
      (this.dots[index] ?? []).forEach((dot, dotIndex) => {
        dot.scale.setScalar(0.65 + Math.max(0, Math.sin(t * 3 - dotIndex * 0.9 + bubble.phase)) * 0.55);
      });
    });
    const up = Math.max(0, 1 - (elapsed - this.flagHitAt) / 2.5);
    this.flag.rotation.z = -Math.PI / 2 + Math.min(1, (Math.sin(t * 0.6) > 0.8 ? 1 : 0) + up) * 1.4;
    this.mailbox.position.y = -2 + Math.sin(t * 0.6) * 0.35;
    this.carrier.update(elapsed, moving && Math.sin(t * 0.7) > 0.7 ? 1 : 0, moving);
    this.confetti.update(0.016);
    if (moving && Math.sin(t * 0.41) > 0.995) this.confetti.burst(new Vector3(11, 4, -3), 40);
  }

  private wingGeometry(): BufferGeometry {
    const geometry = new BufferGeometry();
    const nose = [1.4, 0, 0];
    const left = [-0.9, 0.08, -1];
    const right = [-0.9, 0.08, 1];
    const keel = [-0.9, -0.38, 0];
    const tail = [-0.9, 0.08, 0];
    geometry.setAttribute("position", new Float32BufferAttribute([...nose, ...left, ...tail, ...nose, ...tail, ...right, ...nose, ...tail, ...keel, ...nose, ...keel, ...tail], 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  private addPlane(wing: BufferGeometry, index: number): void {
    const group = new Group();
    const mesh = new Mesh(wing, new MeshStandardMaterial({ color: PLANE_COLORS[index % PLANE_COLORS.length] as number, side: DoubleSide, roughness: 0.8, flatShading: true }));
    mesh.scale.setScalar(2.3);
    group.add(mesh);
    const plane: Flyer = { group, hitAt: -10, base: new Vector3(0, 3 + (index % 4) * 3.2, -9 + (index % 3) * 4), phase: index * 3.1, speed: 0.8 + (index % 3) * 0.25 };
    this.planes.push(plane);
    this.group.add(group);
    Toy.register(this.interactives, `avion-${index}`, group, (now) => {
      plane.hitAt = now;
    });
  }

  private addLetter(toy: Toy, index: number): void {
    const group = new Group();
    group.add(toy.box([1.5, 1, 0.14], 0xfff6dc, [0, 0, 0], 0.07));
    const flapShape = new Shape();
    flapShape.moveTo(-0.72, 0.5);
    flapShape.lineTo(0.72, 0.5);
    flapShape.lineTo(0, -0.1);
    flapShape.closePath();
    const flap = new Mesh(new ExtrudeGeometry(flapShape, { depth: 0.03, bevelEnabled: false }), toy.clay.get(0xffd0e0));
    flap.position.z = 0.07;
    group.add(flap, toy.ball(0.14, 0xff4f8b, [0, -0.08, 0.14]));
    const base = new Vector3(-16 + (index % 4) * 11 + this.rng.between(-2, 2), 2 + Math.floor(index / 4) * 7 + this.rng.between(0, 3), -4 + this.rng.between(-5, 3));
    group.position.copy(base);
    group.scale.setScalar(1.5);
    const letter: Flyer = { group, hitAt: -10, base, phase: index * 2.3, speed: 1 };
    this.letters.push(letter);
    this.group.add(group);
    Toy.register(this.interactives, `sobre-${index}`, group, (now, point) => {
      letter.hitAt = now;
      this.confetti.burst(point, 25);
    });
  }

  private addBubble(toy: Toy, index: number): void {
    const group = new Group();
    const color = BUBBLE_COLORS[index % BUBBLE_COLORS.length] as number;
    group.add(toy.box([3.2, 1.7, 0.4], color, [0, 0, 0], 0.5), toy.box([0.6, 0.6, 0.38], color, [-1, -1.05, 0], 0.16));
    const dots = [-0.8, 0, 0.8].map((x) => toy.ball(0.2, 0xff8fb7, [x, 0, 0.26]));
    group.add(...dots);
    this.dots.push(dots);
    const base = new Vector3(index % 2 === 0 ? -14 : 14, 6 + index * 1.6, -6);
    group.position.copy(base);
    const bubble: Flyer = { group, hitAt: -10, base, phase: index * 1.9, speed: 1 };
    this.bubbles.push(bubble);
    this.group.add(group);
    Toy.register(this.interactives, `burbuja-${index}`, group, (now) => {
      bubble.hitAt = now;
    });
  }

  private buildMailbox(toy: Toy): void {
    this.mailbox.add(toy.box([4.4, 3.4, 5.4], 0x7fd0ea, [0, 1.7, 0], 1.1), toy.box([3.4, 0.28, 0.1], 0x2a1730, [0, 2.2, 2.72], 0.05), toy.box([2.6, 0.8, 0.3], 0xfff6dc, [0, 0.9, 2.7], 0.15));
    this.mailbox.add(toy.cylinder(0.2, 0.3, 1.4, 0xc4805a, [0, -0.5, 0]));
    const pole = toy.cylinder(0.07, 0.07, 1.7, 0xff6b8f, [0, 0.85, 0]);
    const plate = toy.box([0.9, 0.5, 0.1], 0xff6b8f, [0.45, 1.5, 0], 0.05);
    this.flag.add(pole, plate);
    this.flag.position.set(2.3, 2.4, 0);
    this.flag.rotation.z = -Math.PI / 2;
    this.mailbox.add(this.flag);
    this.mailbox.position.set(11, -2, -3);
    this.mailbox.rotation.y = -0.35;
    this.mailbox.scale.setScalar(1.1);
    this.group.add(this.mailbox);
    Toy.register(this.interactives, "buzon", this.mailbox, (now, point) => {
      this.flagHitAt = now;
      this.carrier.poke(now);
      this.confetti.burst(point, 40);
    });
  }
}
