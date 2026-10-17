import { Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { HouseFactory } from "../neighborhood/HouseFactory.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { ToyCar } from "../neighborhood/ToyCar.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { Landscape } from "./Landscape.js";
import type { ScenicWorld } from "./ScenicWorld.js";
import { Toy } from "./Toy.js";

const GROUND = -4.5;
const SPAN = 70;
const HOUSE_IDS = [2, 5, 8, 11, 14, 17, 20] as const;
const CAR_COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2] as const;

interface Car {
  group: Group;
  lights: MeshStandardMaterial;
  lane: number;
  speed: number;
  phase: number;
}

export class NeighborhoodWorld implements ScenicWorld {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  readonly outdoor = true;
  private readonly cars: Car[] = [];
  private readonly lamps: MeshStandardMaterial[] = [];
  private readonly windows: MeshStandardMaterial[] = [];
  private readonly neighbours: GuardianBear[] = [];
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("barrio");

  /**
   * El barrio de los habitantes: una calle con una fila de casitas de colores, cada una con su osito en la puerta
   * saludando, faroles que se encienden de noche, árboles redondos y cochecitos que van y vienen. Es el fondo de la
   * pantalla de habitantes.
   */
  constructor() {
    const clay = new ClayMaterials();
    const toy = new Toy(clay);
    const bears = new BearBuilder();
    const factory = new HouseFactory();
    const trees = new TreeFactory(this.rng);
    this.group.position.y = GROUND;
    this.group.add(Landscape.meadow(toy), Landscape.vegetation("barrio-pasto"), Landscape.hills(toy, "barrio-colinas", 70), this.confetti.mesh);

    const road = toy.box([160, 0.12, 6], 0x6b5a73, [0, 0.06, 5.5], 0.05);
    const walk = toy.box([160, 0.16, 2], 0xfff0d6, [0, 0.08, 0.6], 0.05);
    this.group.add(road, walk);
    for (let x = -38; x <= 38; x += 4) this.group.add(toy.box([1.8, 0.14, 0.2], 0xfff6dc, [x, 0.13, 5.5], 0.04));

    HOUSE_IDS.forEach((id, index) => {
      const x = -30 + index * 10;
      const built = factory.create(id);
      built.group.position.set(x, 0, -4);
      built.group.scale.setScalar(2.1);
      this.windows.push(built.glass);
      this.group.add(built.group);
      const bear = new GuardianBear(bears, index, 0.7, false);
      bear.group.position.set(x + (built.door.position.x + 0.2) * 2.1, 0, -4 + (built.door.position.z + 1.5) * 2.1);
      bear.group.rotation.y = index % 2 === 0 ? 0.3 : -0.3;
      this.neighbours.push(bear);
      this.group.add(bear.group);
      built.group.userData.interactiveId = `casa-${index}`;
      this.interactives.push({
        id: `casa-${index}`,
        object: built.group,
        hit: (now, point) => {
          bear.poke(now);
          this.confetti.burst(point, 35);
        },
      });
      if (index < HOUSE_IDS.length - 1) {
        this.group.add(trees.build(x + 5, -9 - this.rng.between(0, 3), this.rng.between(1.4, 2), this.rng.chance(0.3)));
        this.group.add(this.lamp(toy, x + 5));
      }
    });

    for (let index = 0; index < 5; index += 1) {
      const { group, headlights } = ToyCar.build(CAR_COLORS[index % CAR_COLORS.length] as number);
      group.scale.setScalar(3);
      this.group.add(group);
      this.cars.push({ group, lights: headlights, lane: index % 2 === 0 ? 4.3 : 6.8, speed: 1.6 + (index % 3) * 0.5, phase: index * 17 });
    }
  }

  /**
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Hace circular los coches, saludar a los ositos y encender faroles y ventanas de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.cars.forEach((car) => {
      const direction = car.lane < 5 ? 1 : -1;
      const x = ((((t * car.speed + car.phase) % SPAN) + SPAN) % SPAN) - SPAN / 2;
      car.group.position.set(direction * x, 0.1, car.lane);
      car.group.rotation.y = direction === 1 ? 0 : Math.PI;
      car.lights.emissiveIntensity = 0.3 + night * 1.6;
    });
    this.lamps.forEach((lamp) => {
      lamp.emissiveIntensity = 0.3 + night * 1.4;
    });
    this.windows.forEach((glass) => {
      glass.emissiveIntensity = 0.45 + night * 1;
    });
    this.neighbours.forEach((bear, index) => bear.update(elapsed, moving && Math.sin(t * 0.5 + index * 1.7) > 0.85 ? 1 : 0, moving));
    this.confetti.update(0.016);
  }

  private lamp(toy: Toy, x: number): Group {
    const lamp = new Group();
    const material = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 });
    const bulb = new Mesh(new SphereGeometry(0.4, 14, 10), material);
    bulb.position.y = 3.4;
    this.lamps.push(material);
    lamp.add(toy.cylinder(0.1, 0.14, 3.2, 0x6b4a6a, [0, 1.6, 0]), bulb, toy.cylinder(0.5, 0.25, 0.3, 0xb89cf2, [0, 3.8, 0]));
    lamp.position.set(x, 0, 1.3);
    return lamp;
  }
}
