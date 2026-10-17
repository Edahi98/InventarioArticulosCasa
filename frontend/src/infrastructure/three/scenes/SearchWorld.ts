import { CircleGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, TorusGeometry, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { StarGeometry } from "../StarGeometry.js";
import { Landscape } from "./Landscape.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

const GROUND = -5;
const MARK_COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8] as const;
const PRINTS = 12;

interface Peeker {
  bear: GuardianBear;
  baseX: number;
  hitAt: number;
}

export class SearchWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = true;
  private readonly magnifier = new Group();
  private glint: Mesh | null = null;
  private readonly marks: { group: Group; phase: number; hitAt: number; base: Vector3 }[] = [];
  private readonly prints: Mesh[] = [];
  private readonly peekers: Peeker[] = [];
  private readonly stars: { mesh: Mesh; base: Vector3; phase: number }[] = [];
  private readonly starMaterial = new MeshStandardMaterial({ color: 0xffd43b, emissive: 0xffb300, emissiveIntensity: 0.6, roughness: 0.35 });
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("busqueda");
  private lensHitAt = -10;

  /**
   * La pradera de la búsqueda: una lupa gigante que se pasea revisando el pasto, huellas que van apareciendo en el
   * camino, signos de interrogación que flotan, ositos asomados detrás de los arbustos jugando a las escondidas y
   * estrellitas escondidas entre los árboles. Es el fondo de la pantalla de buscar.
   */
  constructor() {
    const clay = new ClayMaterials();
    const toy = new Toy(clay);
    const bears = new BearBuilder();
    const trees = new TreeFactory(this.rng);
    this.group.position.y = GROUND;
    this.group.add(Landscape.meadow(toy), Landscape.hills(toy, "busqueda-colinas", 50), this.confetti.mesh, this.buildMagnifier(toy));
    this.group.add(...this.footprints(toy));
    [[-18, -10, 2], [-13, -16, 2.4], [16, -12, 2.1], [21, -7, 1.8], [8, -18, 2.4], [-23, -4, 1.6]].forEach(([x, z, scale]) => {
      this.group.add(trees.build(x as number, z as number, scale as number, this.rng.chance(0.3)));
    });
    [[-12, 3], [13, 2], [4, 8]].forEach(([x, z], index) => this.addBush(toy, bears, x as number, z as number, index));
    for (let index = 0; index < 5; index += 1) this.addMark(toy, index);
    for (let index = 0; index < 4; index += 1) this.addStar(index);
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Pasea la lupa, enciende las huellas una tras otra, hace flotar los signos y asomarse a los ositos.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const zoom = Math.max(0, 1 - (elapsed - this.lensHitAt) / 1.2);
    this.magnifier.position.x = -10 + Math.sin(t * 0.35) * 3.5;
    this.magnifier.position.y = 4.4 + Math.sin(t * 0.9) * 0.3 + zoom * 1.5;
    this.magnifier.rotation.z = 0.35 + Math.sin(t * 0.6) * 0.12;
    this.magnifier.scale.setScalar(1.15 + zoom * Math.sin(zoom * Math.PI) * 0.3);
    if (this.glint) this.glint.visible = Math.sin(t * 1.6) > 0.2;
    this.prints.forEach((print, index) => {
      const wave = (t * 1.1 - index * 0.35) % (PRINTS * 0.35 + 2);
      print.scale.setScalar(Math.max(0.001, Math.min(1, wave * 2)) * (wave > PRINTS * 0.35 ? Math.max(0, 1 - (wave - PRINTS * 0.35)) : 1));
    });
    this.marks.forEach((mark) => {
      const spin = Math.max(0, 1 - (elapsed - mark.hitAt) / 1);
      mark.group.position.set(mark.base.x, mark.base.y + Math.sin(t * 0.8 + mark.phase) * 0.8, mark.base.z);
      mark.group.rotation.y = Math.sin(t * 0.5 + mark.phase) * 0.6 + spin * Math.PI * 2;
    });
    this.peekers.forEach((peeker, index) => {
      const out = Math.max(0, Math.sin(t * 0.5 + index * 2.2)) ** 0.5;
      const hop = Math.max(0, 1 - (elapsed - peeker.hitAt) / 1);
      peeker.bear.group.position.y = -1.1 + out * 1.2 + hop * 0.8;
      peeker.bear.update(elapsed, hop > 0 ? 1 : 0, moving);
    });
    this.starMaterial.emissiveIntensity = 0.5 + night * 0.9 + Math.sin(t * 2) * 0.1;
    this.stars.forEach((star) => {
      star.mesh.position.set(star.base.x, star.base.y + Math.sin(t * 1.2 + star.phase) * 0.4, star.base.z);
      star.mesh.rotation.y = t * 0.9 + star.phase;
    });
    this.confetti.update(0.016);
    if (moving && Math.sin(t * 0.43) > 0.995) this.confetti.burst(new Vector3(-3, 6, 4), 35);
  }

  private buildMagnifier(toy: Toy): Group {
    const ring = new Mesh(new TorusGeometry(2.4, 0.4, 14, 40), toy.clay.get(0xffb066));
    const lens = new Mesh(new CircleGeometry(2.4, 36), new MeshStandardMaterial({ color: 0xbfe9f8, transparent: true, opacity: 0.45, roughness: 0.15 }));
    const handle = new Mesh(new CylinderGeometry(0.34, 0.42, 4.2, 14), toy.clay.get(0xc4805a));
    handle.position.set(0, -4.5, 0);
    const grip = new Mesh(new CylinderGeometry(0.5, 0.5, 1.6, 14), toy.clay.get(0xff6b8f));
    grip.position.set(0, -6.1, 0);
    const spark = new Mesh(new CircleGeometry(0.5, 20), toy.clay.get(0xffffff));
    spark.position.set(-1, 1, 0.05);
    spark.scale.set(1, 1.8, 1);
    spark.rotation.z = 0.7;
    this.glint = spark;
    this.magnifier.add(ring, lens, handle, grip, spark);
    this.magnifier.position.set(-10, 4.4, -2);
    this.magnifier.scale.setScalar(1.15);
    Toy.register(this.interactives, "lupa", this.magnifier, (now, point) => {
      this.lensHitAt = now;
      this.confetti.burst(point, 40);
    });
    return this.magnifier;
  }

  private footprints(toy: Toy): Mesh[] {
    for (let index = 0; index < PRINTS; index += 1) {
      const side = index % 2 === 0 ? 0.55 : -0.55;
      const along = index / (PRINTS - 1);
      const print = toy.ball(0.75, 0xc4805a, [-9 + along * 18 + side * 0.2, 0.05, 11 - Math.sin(along * Math.PI) * 4 + side]);
      print.scale.set(1, 0.12, 1.4);
      this.prints.push(print);
    }
    return this.prints;
  }

  private addBush(toy: Toy, bears: BearBuilder, x: number, z: number, index: number): void {
    const bush = new Group();
    [[-1, 0.7, 1.3], [0, 0.95, 1.6], [1.1, 0.7, 1.2]].forEach(([dx, dy, radius], part) => {
      bush.add(toy.ball(radius as number, part === 1 ? 0x7cc88a : 0x86d6a8, [dx as number, dy as number, 0]));
    });
    bush.position.set(x, 0, z);
    const bear = new GuardianBear(bears, index + 1, 0.6, false);
    bear.group.position.set(x, -1.1, z - 1.1);
    this.group.add(bear.group, bush);
    const peeker: Peeker = { bear, baseX: x, hitAt: -10 };
    this.peekers.push(peeker);
    Toy.register(this.interactives, `arbusto-${index}`, bush, (now) => {
      peeker.hitAt = now;
      bear.poke(now);
    });
  }

  private addMark(toy: Toy, index: number): void {
    const group = new Group();
    const color = MARK_COLORS[index % MARK_COLORS.length] as number;
    const hook = new Mesh(new TorusGeometry(0.7, 0.22, 10, 28, Math.PI * 1.45), toy.clay.get(color));
    hook.position.y = 1.2;
    hook.rotation.z = Math.PI * 0.05;
    group.add(hook, toy.cylinder(0.22, 0.22, 0.7, color, [0.28, 0.2, 0]), toy.ball(0.27, color, [0.28, -0.5, 0]));
    const base = new Vector3(-17 + index * 8.5 + this.rng.between(-1.5, 1.5), 8 + (index % 3) * 2.2, -6 + this.rng.between(-4, 3));
    group.position.copy(base);
    group.scale.setScalar(1.7);
    const mark = { group, phase: index * 1.7, hitAt: -10, base };
    this.marks.push(mark);
    this.group.add(group);
    Toy.register(this.interactives, `pregunta-${index}`, group, (now, point) => {
      mark.hitAt = now;
      this.confetti.burst(point, 25);
    });
  }

  private addStar(index: number): void {
    const mesh = new Mesh(StarGeometry.build(), this.starMaterial);
    mesh.scale.setScalar(0.8);
    const base = new Vector3(-20 + index * 13 + this.rng.between(-2, 2), 6 + this.rng.between(0, 5), -9);
    mesh.position.copy(base);
    this.stars.push({ mesh, base, phase: index * 1.3 });
    this.group.add(mesh);
  }
}
