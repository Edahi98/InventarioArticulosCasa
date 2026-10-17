import { Group, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { HelicopterFleet } from "../neighborhood/HelicopterFleet.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { Carousel } from "./Carousel.js";
import { ClayMaterials } from "./ClayMaterials.js";
import { Confetti } from "./Confetti.js";
import { FerrisWheel } from "./FerrisWheel.js";
import type { Interactive } from "./ParkInteraction.js";
import { ParkScenery, PARK_CENTER } from "./ParkScenery.js";
import { ParkSkyToys } from "./ParkSkyToys.js";
import { ToyTrain } from "./ToyTrain.js";

const CELEBRATIONS: Vector3[] = [new Vector3(12, 15, -8), new Vector3(PARK_CENTER.x, 7, PARK_CENTER.z), new Vector3(2, 9, 4), new Vector3(20, 10, 0)];

export class ParkBuilder {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly scenery: ParkScenery;
  private readonly wheel: FerrisWheel;
  private readonly carousel: Carousel;
  private readonly train: ToyTrain;
  private readonly toys: ParkSkyToys;
  private readonly fleet = new HelicopterFleet({ center: [PARK_CENTER.x, 10.5, PARK_CENTER.z - 8], rx: 20, rz: 10, scale: 3.2 });
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("fiesta");
  private nextParty = 7;
  private last = 0;

  /**
   * El parque de los guardianes: pradera con árboles, colinas y estanque, una rueda de la fortuna, un carrusel con
   * un trencito dando vueltas alrededor, y juguetes en el cielo. De vez en cuando lanza confeti por su cuenta.
   */
  constructor() {
    const clay = new ClayMaterials();
    const bears = new BearBuilder();
    this.scenery = new ParkScenery(new TreeFactory(this.rng), clay);
    this.wheel = new FerrisWheel(bears, clay);
    this.wheel.group.position.set(12, 0, -8);
    this.carousel = new Carousel(bears, clay);
    this.carousel.group.position.set(PARK_CENTER.x, 0, PARK_CENTER.z);
    this.train = new ToyTrain(clay);
    this.train.group.position.set(PARK_CENTER.x, 0, PARK_CENTER.z);
    this.toys = new ParkSkyToys(clay, (point) => this.confetti.burst(point, 70));
    this.interactives = [...this.wheel.interactives, ...this.carousel.interactives, ...this.train.interactives, ...this.toys.interactives];
    this.group.add(this.scenery.group, this.wheel.group, this.carousel.group, this.train.group, this.toys.group, this.fleet.group, this.confetti.mesh);
  }

  /**
   * Lanza una ráfaga de confeti desde un punto.
   *
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Anima todo el parque y, cada unos segundos, lanza confeti desde un rincón distinto.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.1);
    this.last = elapsed;
    this.scenery.update(elapsed, moving);
    this.wheel.update(elapsed, night, moving);
    this.carousel.update(elapsed, night, moving);
    this.train.update(elapsed, night, moving);
    this.toys.update(elapsed, night, moving);
    this.fleet.update(elapsed, moving);
    this.confetti.update(dt);
    if (moving && elapsed > this.nextParty) {
      this.confetti.burst(this.rng.pick(CELEBRATIONS), 55);
      this.nextParty = elapsed + this.rng.between(8, 13);
    }
  }
}
